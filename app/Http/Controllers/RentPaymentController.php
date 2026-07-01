<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\CashMovement;
use App\Models\FinanceAccount;
use App\Models\Lease;
use App\Models\Property;
use App\Models\RentPayment;
use App\Services\Finance\RentalFinanceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $lease = Lease::query()
            ->with(['currency:id,code,symbol', 'property:id,name'])
            ->findOrFail($validated['lease_id']);
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

        DB::transaction(function () use ($request, $validated, $lease): void {
            $payment = RentPayment::query()->create([
                ...$validated,
                'tenant_id' => $lease->tenant_id,
                'property_id' => $lease->property_id,
                'currency_id' => $lease->currency_id,
                'status' => 'received',
                'created_by' => $request->user()?->id,
            ]);

            $this->recordRentCashMovement($payment, $lease, $request);
        });

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

        CashMovement::query()
            ->where('reference_type', 'rent_payment')
            ->where('reference_id', $rentPayment->id)
            ->update([
                'approval_status' => 'draft',
                'approved_by' => null,
                'description' => trim(($rentPayment->reference ? "{$rentPayment->reference} - " : '').'Voided rent receipt: '.$validated['void_reason']),
            ]);

        return back()->with('success', __('rentals.actions.voided'));
    }

    private function recordRentCashMovement(RentPayment $payment, Lease $lease, Request $request): void
    {
        $currencyCode = strtoupper($lease->currency?->code ?? 'AFN');
        $account = $this->cashOnHandAccount(
            propertyId: $lease->property_id,
            propertyName: $lease->property?->name,
            currencyCode: $currencyCode,
        );

        CashMovement::query()->create([
            'property_id' => $lease->property_id,
            'movement_type' => 'rent_collection',
            'direction' => 'in',
            'movement_date' => $payment->payment_date,
            'amount' => $payment->amount,
            'payment_method' => $payment->payment_method,
            'account_id' => $account->id,
            'counterparty_account_id' => null,
            'reference_type' => 'rent_payment',
            'reference_id' => $payment->id,
            'created_by' => $request->user()?->id,
            'approved_by' => $request->user()?->id,
            'approval_status' => 'approved',
            'description' => $payment->reference
                ? 'Rent receipt '.$payment->reference
                : 'Rent receipt '.$payment->receipt_number,
        ]);
    }

    private function cashOnHandAccount(?int $propertyId, ?string $propertyName, string $currencyCode): FinanceAccount
    {
        $scope = $propertyId ? "P{$propertyId}" : 'GROUP';
        $code = "CASH-{$scope}-{$currencyCode}";

        return FinanceAccount::query()->firstOrCreate(
            ['code' => $code],
            [
                'name' => trim('Cash on Hand '.$currencyCode.($propertyName ? ' - '.$propertyName : '')),
                'type' => 'asset',
                'parent_id' => null,
                'property_id' => $propertyId,
                'currency_code' => $currencyCode,
                'is_postable' => true,
                'is_system' => true,
                'status' => 'active',
                'description' => 'Auto-created cash-on-hand account for received rent.',
            ],
        );
    }
}
