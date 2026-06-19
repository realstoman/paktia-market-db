<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\TenantDocument;
use App\Services\Tenants\TenantLeaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantController extends Controller
{
    public function index()
    {
        return Inertia::render('tenants/index', [
            'tenants' => Tenant::query()
                ->with([
                    'documents',
                    'leases.property:id,name,name_translations,property_type',
                    'leases.floor:id,name,level_number',
                    'leases.unit:id,unit_number,unit_type,property_floor_id',
                    'leases.currency:id,code,symbol',
                ])
                ->withCount('leases')
                ->latest()
                ->get(),
            'properties' => $this->propertyOptions(),
            'currencies' => Currency::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'symbol']),
        ]);
    }

    public function show(Tenant $tenant)
    {
        return Inertia::render('tenants/show', [
            'tenant' => $tenant->load([
                'documents',
                'leases.property:id,name,name_translations,property_type,address,address_translations',
                'leases.floor:id,name,level_number',
                'leases.unit:id,unit_number,unit_type,property_floor_id,area_sqm,rooms_count',
                'leases.currency:id,code,symbol',
            ]),
            'properties' => $this->propertyOptions(),
            'currencies' => Currency::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'symbol']),
        ]);
    }

    public function card(Tenant $tenant)
    {
        return Inertia::render('tenants/card', [
            'tenant' => $tenant->load([
                'leases.property:id,name,name_translations,property_type',
                'leases.floor:id,name,level_number',
                'leases.unit:id,unit_number,unit_type,property_floor_id',
            ]),
        ]);
    }

    public function store(Request $request, TenantLeaseService $leases)
    {
        $validated = $this->validateTenant($request);
        $lease = $this->validateOptionalLease($request);

        $tenant = DB::transaction(function () use ($request, $validated, $lease, $leases): Tenant {
            $validated = $this->storePhoto($request, $validated);
            $tenant = Tenant::query()->create($validated);
            $this->storeDocuments($request, $tenant);

            if ($lease !== null) {
                $leases->create([...$lease, 'tenant_id' => $tenant->id]);
            }

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

    public function toggle(Tenant $tenant)
    {
        $tenant->update(['is_active' => ! $tenant->is_active]);

        return back()->with('success', 'Tenant status updated successfully.');
    }

    public function uploadDocuments(Request $request, Tenant $tenant)
    {
        $request->validate([
            'documents' => ['required', 'array', 'min:1', 'max:10'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ]);
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
        return $request->validate([
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
            'documents' => ['nullable', 'array', 'max:10'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ]);
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
            'status' => ['required', Rule::in(['draft', 'active'])],
            'terms' => ['nullable', 'string', 'max:5000'],
            'lease_notes' => ['nullable', 'string', 'max:2000'],
        ], attributes: [
            'property_unit_id' => 'shop or apartment',
        ]);
        $validated['notes'] = $validated['lease_notes'] ?? null;
        unset($validated['lease_notes']);

        return $validated;
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
