<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\CashMovement;
use App\Models\Currency;
use App\Models\FinanceAccount;
use App\Models\Lease;
use App\Models\Property;
use App\Models\RentPayment;
use App\Models\Tenant;
use App\Models\TenantDocument;
use App\Services\Tenants\TenantLeaseService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        if ($request->filled('scan')) {
            $scannedTenant = Tenant::query()
                ->where('card_code', trim((string) $request->input('scan')))
                ->first();

            if ($scannedTenant) {
                return redirect()->route('tenants.show', $scannedTenant);
            }
        }

        $propertyId = $request->integer('property_id');
        $propertyId = $propertyId && Property::query()->whereKey($propertyId)->exists()
            ? $propertyId
            : null;

        $search = trim((string) $request->input('search', ''));
        $tenantKind = $request->input('tenant_kind');
        $tenantKind = in_array($tenantKind, ['business', 'person'], true)
            ? $tenantKind
            : null;
        $noBusinessNames = ['', 'ندارد', 'نخیر', 'نه', 'no', 'none', 'n/a', 'na', '-'];
        $businessTenant = fn ($query, $_ = null) => $query->where(fn ($businesses) => $businesses
            ->where('tenant_type', 'company')
            ->orWhere(fn ($namedBusiness) => $namedBusiness
                ->whereNotNull('business_name')
                ->whereRaw(
                    'LOWER(TRIM(business_name)) NOT IN ('.implode(',', array_fill(0, count($noBusinessNames), '?')).')',
                    $noBusinessNames,
                )));
        $personTenant = fn ($query, $_ = null) => $query->where(fn ($people) => $people
            ->where('tenant_type', 'individual')
            ->where(fn ($withoutBusiness) => $withoutBusiness
                ->whereNull('business_name')
                ->orWhereRaw(
                    'LOWER(TRIM(business_name)) IN ('.implode(',', array_fill(0, count($noBusinessNames), '?')).')',
                    $noBusinessNames,
                )));
        $activeLease = fn ($query, $_ = null) => $query
            ->where('status', 'active')
            ->whereDate('start_date', '<=', today())
            ->where(fn ($period) => $period
                ->whereNull('end_date')
                ->orWhereDate('end_date', '>=', today()));
        $tenantScope = Tenant::query()
            ->when($propertyId, fn ($query) => $query->whereHas(
                'leases',
                fn ($leases) => $leases->where('property_id', $propertyId),
            ))
            ->when($tenantKind === 'business', $businessTenant)
            ->when($tenantKind === 'person', $personTenant);
        $summary = [
            'total' => (clone $tenantScope)->count(),
            'assigned' => (clone $tenantScope)->whereHas(
                'leases',
                $activeLease,
            )->count(),
            'persons' => $personTenant(clone $tenantScope)->count(),
            'businesses' => $businessTenant(clone $tenantScope)->count(),
            'properties' => Lease::query()
                ->whereIn('tenant_id', (clone $tenantScope)->select('tenants.id'))
                ->where('status', 'active')
                ->whereDate('start_date', '<=', today())
                ->where(fn ($period) => $period
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', today()))
                ->count(),
        ];
        $tenants = (clone $tenantScope)
            ->when($search !== '', fn ($query) => $query->where(function ($matches) use ($search): void {
                $like = "%{$search}%";
                $matches
                    ->where('full_name', 'like', $like)
                    ->orWhere('business_name', 'like', $like)
                    ->orWhere('phone', 'like', $like)
                    ->orWhere('card_code', 'like', $like)
                    ->orWhereHas('leases.property', fn ($properties) => $properties
                        ->where('name', 'like', $like)
                        ->orWhere('external_unit_number', 'like', $like))
                    ->orWhereHas('leases.unit', fn ($units) => $units
                        ->where('unit_number', 'like', $like));
            }))
            ->with([
                'documents',
                'leases.property:id,name,name_translations,property_type,external_unit_number',
                'leases.property.typeDefinition:id,key,name,name_translations,behavior,is_active,sort_order',
                'leases.floor:id,name,level_number',
                'leases.unit:id,unit_number,unit_type,property_floor_id',
                'leases.currency:id,code,symbol',
            ])
            ->withCount('leases')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tenants/index', [
            'tenants' => $tenants,
            'summary' => $summary,
            'filters' => [
                'search' => $search,
                'property_id' => $propertyId,
                'tenant_kind' => $tenantKind,
            ],
            'properties' => $this->propertyOptions(),
            'currencies' => Currency::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'symbol']),
            'initialPropertyId' => $propertyId,
        ]);
    }

    public function show(Request $request, Tenant $tenant)
    {
        return Inertia::render('tenants/show', [
            'tenant' => $tenant->load([
                'documents',
                'leases.property:id,name,name_translations,property_type,address,address_translations,external_unit_number',
                'leases.property.typeDefinition:id,key,name,name_translations,behavior,is_active,sort_order',
                'leases.floor:id,name,level_number',
                'leases.unit:id,unit_number,unit_type,property_floor_id,area_sqm,rooms_count',
                'leases.currency:id,code,symbol',
            ]),
            'properties' => $this->propertyOptions(),
            'currencies' => Currency::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'symbol']),
            'openEdit' => $request->boolean('edit'),
        ]);
    }

    public function card(Request $request, Tenant $tenant)
    {
        return Inertia::render('tenants/card', [
            'tenant' => $tenant->load([
                'leases.property:id,name,name_translations,property_type,external_unit_number',
                'leases.property.typeDefinition:id,key,name,name_translations,behavior,is_active,sort_order',
                'leases.floor:id,name,level_number',
                'leases.unit:id,unit_number,unit_type,property_floor_id',
            ]),
            'selectedLeaseId' => $request->integer('lease_id') ?: null,
        ]);
    }

    public function store(Request $request, TenantLeaseService $leases)
    {
        $validated = $this->validateTenant($request);
        $lease = $this->validateOptionalLease($request);
        $initialRent = $this->validateInitialRentPayment($request, $lease);

        $tenant = DB::transaction(function () use ($request, $validated, $lease, $initialRent, $leases): Tenant {
            unset($validated['photo'], $validated['documents']);
            $tenant = Tenant::query()->create($validated);

            if ($lease !== null) {
                $createdLease = $leases->create([...$lease, 'tenant_id' => $tenant->id]);

                if ($initialRent !== null) {
                    $this->recordInitialRentPayment($createdLease, $initialRent, $request);
                }
            }

            $tenant->update($this->storePhoto($request, [], $tenant));
            $this->storeDocuments($request, $tenant);

            return $tenant;
        });

        return redirect()->route('tenants.show', $tenant)
            ->with('success', 'Tenant registered successfully.');
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $this->storePhoto(
            $request,
            $this->validateTenant($request, $tenant),
            $tenant,
        );
        $tenant->update($validated);

        return back()->with('success', 'Tenant profile updated successfully.');
    }

    public function storeLease(Request $request, Tenant $tenant, TenantLeaseService $leases)
    {
        $validated = $this->validateLease($request);
        $leases->create([...$validated, 'tenant_id' => $tenant->id]);

        return back()->with('success', 'Property assignment created successfully.');
    }

    public function updateLease(Request $request, Tenant $tenant, Lease $lease, TenantLeaseService $leases)
    {
        abort_unless($lease->tenant_id === $tenant->id, 404);

        $validated = $this->validateLease($request);
        $leases->update($lease, [...$validated, 'tenant_id' => $tenant->id]);

        return back()->with('success', 'Property assignment updated successfully.');
    }

    public function toggle(Tenant $tenant)
    {
        $tenant->update(['is_active' => ! $tenant->is_active]);

        return back()->with('success', __(
            $tenant->is_active
                ? 'tenants.actions.activated'
                : 'tenants.actions.deactivated',
            ['name' => $tenant->business_name ?: $tenant->full_name],
        ));
    }

    public function uploadDocuments(Request $request, Tenant $tenant)
    {
        $this->validateTenantDocuments($request, true);
        $this->storeDocuments($request, $tenant);

        return back()->with('success', 'Documents uploaded successfully.');
    }

    public function downloadDocument(Tenant $tenant, TenantDocument $document): StreamedResponse
    {
        abort_unless($document->tenant_id === $tenant->id, 404);

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    public function destroyDocument(Tenant $tenant, TenantDocument $document)
    {
        abort_unless($document->tenant_id === $tenant->id, 404);
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return back()->with('success', 'Document removed successfully.');
    }

    private function validateTenant(Request $request, ?Tenant $tenant = null): array
    {
        $validated = $request->validate([
            'tenant_type' => ['required', Rule::in(['individual', 'company'])],
            'full_name' => ['required', 'string', 'max:255'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'nid_number' => ['nullable', 'string', 'max:100'],
            'license_number' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'documents' => ['nullable', 'array', 'max:5'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:2048'],
        ]);

        $this->validateTenantDocuments($request);

        return $validated;
    }

    private function validateTenantDocuments(Request $request, bool $required = false): void
    {
        $request->validate([
            'documents' => array_values(array_filter([
                $required ? 'required' : 'nullable',
                'array',
                $required ? 'min:1' : null,
                'max:5',
            ])),
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:2048'],
        ]);

        $totalBytes = collect($request->file('documents', []))
            ->sum(fn ($file) => $file->getSize());

        if ($totalBytes > 2 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'documents' => __('The selected documents must not exceed 2 MB in total.'),
            ]);
        }
    }

    private function validateOptionalLease(Request $request): ?array
    {
        return $request->filled('property_id') ? $this->validateLease($request) : null;
    }

    private function validateLease(Request $request): array
    {
        $validated = $request->validate([
            'property_id' => ['required', 'exists:properties,id'],
            'property_unit_id' => ['nullable', 'exists:property_units,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'rent_amount' => ['nullable', 'numeric', 'min:0'],
            'security_deposit' => ['nullable', 'numeric', 'min:0'],
            'currency_id' => ['nullable', 'exists:currencies,id'],
            'payment_frequency' => ['required', Rule::in(['monthly', 'quarterly', 'yearly'])],
            'status' => ['required', Rule::in(['draft', 'active', 'ended', 'terminated'])],
            'terms' => ['nullable', 'string', 'max:5000'],
            'lease_notes' => ['nullable', 'string', 'max:2000'],
        ], attributes: [
            'property_unit_id' => 'shop or apartment',
        ]);
        $validated['notes'] = $validated['lease_notes'] ?? null;
        unset($validated['lease_notes']);

        return $validated;
    }

    private function validateInitialRentPayment(Request $request, ?array $lease): ?array
    {
        if ($lease === null) {
            return null;
        }

        $validated = $request->validate([
            'initial_rent_months' => ['nullable', 'integer', 'min:0', 'max:24'],
            'initial_rent_payment_date' => ['nullable', 'date'],
            'initial_rent_payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
        ]);
        $months = (int) ($validated['initial_rent_months'] ?? 0);

        if ($months <= 0 || (float) ($lease['rent_amount'] ?? 0) <= 0) {
            return null;
        }

        return [
            'months' => $months,
            'payment_date' => $validated['initial_rent_payment_date'] ?? now()->toDateString(),
            'payment_method' => $validated['initial_rent_payment_method'] ?? PaymentMethod::CASH->value,
        ];
    }

    private function recordInitialRentPayment(Lease $lease, array $initialRent, Request $request): void
    {
        $lease->loadMissing(['currency:id,code,symbol', 'property:id,name']);
        $periodStart = Carbon::parse($lease->start_date);
        $periodEnd = $periodStart->copy()
            ->addMonthsNoOverflow((int) $initialRent['months'])
            ->subDay();

        if ($lease->end_date && $periodEnd->gt(Carbon::parse($lease->end_date))) {
            $periodEnd = Carbon::parse($lease->end_date);
        }

        $payment = RentPayment::query()->create([
            'lease_id' => $lease->id,
            'tenant_id' => $lease->tenant_id,
            'property_id' => $lease->property_id,
            'currency_id' => $lease->currency_id,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'payment_date' => $initialRent['payment_date'],
            'amount' => (float) $lease->rent_amount * (int) $initialRent['months'],
            'payment_method' => $initialRent['payment_method'],
            'reference' => 'Initial prepaid rent',
            'notes' => 'Initial prepaid rent collected during tenant registration.',
            'status' => 'received',
            'created_by' => $request->user()?->id,
        ]);

        $currencyCode = strtoupper($lease->currency?->code ?? 'AFN');
        $account = $this->cashOnHandAccount($lease->property_id, $lease->property?->name, $currencyCode);

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
            'description' => 'Initial prepaid rent for contract '.$lease->contract_number,
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
                'description' => 'Auto-created cash-on-hand account for initial tenant rent.',
            ],
        );
    }

    private function storePhoto(Request $request, array $validated, ?Tenant $tenant = null): array
    {
        unset($validated['photo'], $validated['documents']);

        if ($request->hasFile('photo')) {
            if ($tenant?->photo_path) {
                Storage::disk('public')->delete($tenant->photo_path);
            }

            $validated['photo_path'] = $request->file('photo')->store('tenants/photos', 'public');
        }

        return $validated;
    }

    private function storeDocuments(Request $request, Tenant $tenant): void
    {
        foreach ($request->file('documents', []) as $file) {
            $path = $file->store("tenants/{$tenant->id}/documents", 'local');
            $tenant->documents()->create([
                'document_type' => 'other',
                'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size_bytes' => $file->getSize(),
            ]);
        }
    }

    private function propertyOptions()
    {
        return Property::query()
            ->where('is_active', true)
            ->with('typeDefinition')
            ->with([
                'floors' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['units' => fn ($units) => $units->where('is_active', true)->orderBy('unit_number')])
                    ->orderBy('level_number'),
            ])
            ->orderBy('name')
            ->get([
                'id', 'name', 'name_translations', 'property_type', 'address',
                'address_translations', 'is_active',
            ]);
    }
}
