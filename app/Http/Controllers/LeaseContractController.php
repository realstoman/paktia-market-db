<?php

namespace App\Http\Controllers;

use App\Models\ContractTemplate;
use App\Models\Lease;
use App\Models\LeaseContractDocument;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeaseContractController extends Controller
{
    public function show(Request $request, Tenant $tenant, Lease $lease)
    {
        $this->ensureLeaseBelongsToTenant($tenant, $lease);
        $lease->load([
            'tenant',
            'property:id,name,name_translations,property_type,address,address_translations,external_unit_number',
            'floor:id,name,level_number',
            'unit:id,unit_number,unit_type,property_floor_id',
            'currency:id,code,symbol',
            'contractDocuments.template:id,name',
        ]);

        $templates = ContractTemplate::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query
                ->whereNull('property_id')
                ->orWhere('property_id', $lease->property_id))
            ->with('articles')
            ->orderByDesc('property_id')
            ->orderByDesc('is_default')
            ->get();
        $requestedTemplateId = $request->integer('template_id');
        $template = $templates->firstWhere('id', $requestedTemplateId)
            ?? $templates->firstWhere('property_id', $lease->property_id)
            ?? $templates->firstWhere('is_default', true)
            ?? $templates->first();

        abort_unless($template, 404, 'No active contract template is available.');

        return Inertia::render('contracts/lease-contract', [
            'tenant' => $tenant,
            'lease' => $lease,
            'template' => $template,
            'templates' => $templates->map(fn (ContractTemplate $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'property_id' => $item->property_id,
            ]),
            'signedDocuments' => $lease->contractDocuments,
        ]);
    }

    public function storeSigned(Request $request, Tenant $tenant, Lease $lease)
    {
        $this->ensureLeaseBelongsToTenant($tenant, $lease);
        $validated = $request->validate([
            'contract_template_id' => ['nullable', 'exists:contract_templates,id'],
            'signed_at' => ['nullable', 'date'],
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:20480'],
        ]);
        $file = $request->file('document');
        $path = $file->store("leases/{$lease->id}/signed-contracts", 'local');

        $lease->contractDocuments()->create([
            'contract_template_id' => $validated['contract_template_id'] ?? null,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'uploaded_by' => $request->user()?->id,
            'signed_at' => $validated['signed_at'] ?? now(),
        ]);

        return back()->with('success', __('contracts.actions.signed_uploaded'));
    }

    public function downloadSigned(Tenant $tenant, Lease $lease, LeaseContractDocument $document): StreamedResponse
    {
        $this->ensureLeaseBelongsToTenant($tenant, $lease);
        abort_unless($document->lease_id === $lease->id, 404);

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    public function destroySigned(Tenant $tenant, Lease $lease, LeaseContractDocument $document)
    {
        $this->ensureLeaseBelongsToTenant($tenant, $lease);
        abort_unless($document->lease_id === $lease->id, 404);

        Storage::disk('local')->delete($document->path);
        $document->delete();

        return back()->with('success', __('contracts.actions.signed_deleted'));
    }

    private function ensureLeaseBelongsToTenant(Tenant $tenant, Lease $lease): void
    {
        abort_unless($lease->tenant_id === $tenant->id, 404);
    }
}
