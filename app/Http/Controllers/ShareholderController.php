<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Currency;
use App\Models\Property;
use App\Models\PropertyShareholding;
use App\Models\Shareholder;
use App\Models\ShareholderDocument;
use App\Services\Ownership\PropertyOwnershipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ShareholderController extends Controller
{
    public function index()
    {
        $shareholders = Shareholder::query()
            ->with([
                'countryOfBirth:id,name,name_translations',
                'citizenshipCountry:id,name,name_translations',
                'documents',
                'shareholdings.property:id,name,name_translations,property_type',
                'shareholdings.currency:id,code,symbol',
            ])
            ->withCount('shareholdings')
            ->latest()
            ->get();

        return Inertia::render('shareholders/index', [
            'shareholders' => $shareholders,
            'countries' => Country::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'name_translations']),
            'properties' => Property::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'name_translations', 'property_type', 'address', 'address_translations']),
            'currencies' => Currency::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'symbol']),
        ]);
    }

    public function show(Shareholder $shareholder)
    {
        $shareholder->load([
            'countryOfBirth:id,name,name_translations',
            'citizenshipCountry:id,name,name_translations',
            'documents',
            'shareholdings.property:id,name,name_translations,property_type,usage_type,address,address_translations',
            'shareholdings.currency:id,code,symbol',
        ]);

        return Inertia::render('shareholders/show', [
            'shareholder' => $shareholder,
            'properties' => Property::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'name_translations', 'property_type', 'address', 'address_translations']),
            'currencies' => Currency::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'symbol']),
        ]);
    }

    public function store(Request $request, PropertyOwnershipService $ownership)
    {
        $validated = $this->validateShareholder($request);
        $assignments = $this->validateOptionalAssignments($request);

        $shareholder = DB::transaction(function () use ($request, $validated, $assignments, $ownership): Shareholder {
            $validated = $this->storePhoto($request, $validated);
            $shareholder = Shareholder::query()->create($validated);
            $this->storeDocuments($request, $shareholder);

            foreach ($assignments as $assignment) {
                $ownership->assign([...$assignment, 'shareholder_id' => $shareholder->id]);
            }

            return $shareholder;
        });

        return back()->with('success', "Shareholder {$shareholder->full_name} registered successfully.");
    }

    public function update(Request $request, Shareholder $shareholder)
    {
        $validated = $this->validateShareholder($request, $shareholder);
        $validated = $this->storePhoto($request, $validated, $shareholder);
        $shareholder->update($validated);

        return back()->with('success', 'Shareholder updated successfully.');
    }

    public function toggle(Shareholder $shareholder)
    {
        $shareholder->update(['is_active' => ! $shareholder->is_active]);

        return back()->with('success', 'Shareholder status updated successfully.');
    }

    public function uploadDocuments(Request $request, Shareholder $shareholder)
    {
        $request->validate([
            'documents' => ['required', 'array', 'min:1', 'max:10'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ]);
        $this->storeDocuments($request, $shareholder);

        return back()->with('success', 'Documents uploaded successfully.');
    }

    public function downloadDocument(Shareholder $shareholder, ShareholderDocument $document): StreamedResponse
    {
        abort_unless($document->shareholder_id === $shareholder->id, 404);

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    public function destroyDocument(Shareholder $shareholder, ShareholderDocument $document)
    {
        abort_unless($document->shareholder_id === $shareholder->id, 404);
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return back()->with('success', 'Document removed successfully.');
    }

    public function assign(Request $request, Shareholder $shareholder, PropertyOwnershipService $ownership)
    {
        $validated = $this->validateAssignment($request);
        $ownership->assign([...$validated, 'shareholder_id' => $shareholder->id]);

        return back()->with('success', 'Property ownership assigned successfully.');
    }

    public function closeAssignment(Request $request, Shareholder $shareholder, PropertyShareholding $shareholding, PropertyOwnershipService $ownership)
    {
        abort_unless($shareholding->shareholder_id === $shareholder->id, 404);
        $validated = $request->validate(['effective_to' => ['required', 'date']]);
        $ownership->close($shareholding, $validated['effective_to']);

        return back()->with('success', 'Ownership period closed successfully.');
    }

    private function validateShareholder(Request $request, ?Shareholder $shareholder = null): array
    {
        return $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'grandfather_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'country_of_birth_id' => ['nullable', 'exists:countries,id'],
            'citizenship_country_id' => ['nullable', 'exists:countries,id'],
            'nid_type' => ['required', Rule::in(['electronic', 'paper', 'passport', 'other'])],
            'nid_number' => ['required', 'string', 'max:100', Rule::unique('shareholders')->ignore($shareholder)],
            'phone' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'documents' => ['nullable', 'array', 'max:10'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function validateOptionalAssignments(Request $request): array
    {
        if ($request->has('shareholdings')) {
            $validated = $request->validate([
                'shareholdings' => ['nullable', 'array', 'max:50'],
                'shareholdings.*.property_id' => ['required', 'distinct', 'exists:properties,id'],
                'shareholdings.*.percentage' => ['required', 'numeric', 'gt:0', 'max:100'],
                'shareholdings.*.capital_contribution' => ['nullable', 'numeric', 'min:0'],
                'shareholdings.*.currency_id' => ['nullable', 'exists:currencies,id'],
                'shareholdings.*.effective_from' => ['required', 'date'],
                'shareholdings.*.effective_to' => ['nullable', 'date'],
                'shareholdings.*.assignment_notes' => ['nullable', 'string', 'max:2000'],
            ]);

            return collect($validated['shareholdings'] ?? [])
                ->map(fn (array $assignment) => $this->normalizeAssignment($assignment))
                ->all();
        }

        if (! $request->filled('property_id')) {
            return [];
        }

        return [$this->validateAssignment($request)];
    }

    private function validateAssignment(Request $request): array
    {
        return $this->normalizeAssignment($request->validate([
            'property_id' => ['required', 'exists:properties,id'],
            'percentage' => ['required', 'numeric', 'gt:0', 'max:100'],
            'capital_contribution' => ['nullable', 'numeric', 'min:0'],
            'currency_id' => ['nullable', 'exists:currencies,id'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'assignment_notes' => ['nullable', 'string', 'max:2000'],
        ]));
    }

    private function normalizeAssignment(array $assignment): array
    {
        return collect($assignment)
            ->mapWithKeys(fn ($value, $key) => [$key === 'assignment_notes' ? 'notes' : $key => $value])
            ->all();
    }

    private function storePhoto(Request $request, array $validated, ?Shareholder $shareholder = null): array
    {
        unset($validated['photo'], $validated['documents']);
        if ($request->hasFile('photo')) {
            if ($shareholder?->photo_path) {
                Storage::disk('public')->delete($shareholder->photo_path);
            }
            $validated['photo_path'] = $request->file('photo')->store('shareholders/photos', 'public');
        }

        return $validated;
    }

    private function storeDocuments(Request $request, Shareholder $shareholder): void
    {
        foreach ($request->file('documents', []) as $file) {
            $path = $file->store("shareholders/{$shareholder->id}/documents", 'local');
            $shareholder->documents()->create([
                'document_type' => 'other',
                'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size_bytes' => $file->getSize(),
            ]);
        }
    }
}
