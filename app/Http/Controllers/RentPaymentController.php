<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\Lease;
use App\Models\Property;
use App\Models\RentPayment;
use App\Services\Finance\RentalFinanceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RentPaymentController extends Controller
{
    public function __construct(
        private readonly RentalFinanceService $rentalFinance,
    ) {}

    public function index(Request $request)
    {
        $validated = $request->validate([
            'property_id' => ['nullable', 'exists:properties,id'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);
        $startDate = Carbon::parse($validated['start_date'] ?? now()->startOfMonth()->toDateString())->startOfDay();
        $endDate = Carbon::parse($validated['end_date'] ?? now()->endOfMonth()->toDateString())->endOfDay();
        $propertyId = isset($validated['property_id']) ? (int) $validated['property_id'] : null;

        return Inertia::render('finance/rentals/index', [
            'filters' => [
                'propertyId' => $propertyId,
                'startDate' => $startDate->toDateString(),
                'endDate' => $endDate->toDateString(),
            ],
            'summary' => $this->rentalFinance->summary($startDate, $endDate, $propertyId),
            'properties' => Property::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name', 'name_translations']),
            'leases' => Lease::query()
                ->with([
                    'tenant:id,full_name,business_name',
                    'property:id,name,name_translations,property_type,external_unit_number',
                    'floor:id,name',
                    'unit:id,unit_number,unit_type,property_floor_id',
                    'currency:id,code,symbol',
                ])
                ->where('status', 'active')
                ->orderBy('contract_number')
                ->get(),
            'payments' => RentPayment::query()
                ->with([
                    'tenant:id,full_name,business_name',
                    'property:id,name,name_translations',
                    'lease:id,contract_number',
                    'currency:id,code,symbol',
                    'creator:id,name',
                ])
                ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
                ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->latest('payment_date')
                ->latest('id')
                ->paginate(15)
                ->withQueryString(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lease_id' => ['required', 'exists:leases,id'],
            'period_start' => ['required', 'date_format:Y-m-d'],
            'period_end' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'payment_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $lease = Lease::query()->findOrFail($validated['lease_id']);
        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = isset($validated['period_end'])
            ? Carbon::parse($validated['period_end'])
            : $periodStart;
        if (
            $periodStart->lt(Carbon::parse($lease->start_date))
            || ($lease->end_date && $periodEnd->gt(Carbon::parse($lease->end_date)))
        ) {
            throw ValidationException::withMessages([
                'period_start' => __('rentals.validation.period_outside_contract'),
            ]);
        }

        RentPayment::query()->create([
            ...$validated,
            'tenant_id' => $lease->tenant_id,
            'property_id' => $lease->property_id,
            'currency_id' => $lease->currency_id,
            'status' => 'received',
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', __('rentals.actions.created'));
    }

    public function void(Request $request, RentPayment $rentPayment)
    {
        abort_if($rentPayment->status === 'void', 422, 'Payment is already void.');
        $validated = $request->validate([
            'void_reason' => ['required', 'string', 'max:1000'],
        ]);
        $rentPayment->update([
            'status' => 'void',
            'voided_at' => now(),
            'voided_by' => $request->user()?->id,
            'void_reason' => $validated['void_reason'],
        ]);

        return back()->with('success', __('rentals.actions.voided'));
    }
}
