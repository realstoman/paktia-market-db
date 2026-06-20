<?php

namespace App\Http\Controllers;

use App\Models\ContractTemplate;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ContractTemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('contracts/templates', [
            'templates' => ContractTemplate::query()
                ->with(['property:id,name,name_translations', 'articles'])
                ->latest('is_default')
                ->latest()
                ->get(),
            'properties' => Property::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->get(['id', 'name', 'name_translations', 'property_type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateTemplate($request);
        $articles = $validated['articles'];
        unset($validated['articles'], $validated['logo']);

        DB::transaction(function () use ($request, $validated, $articles): void {
            if ($validated['is_default']) {
                ContractTemplate::query()->update(['is_default' => false]);
            }

            if ($request->hasFile('logo')) {
                $validated['logo_path'] = $request->file('logo')->store('contract-templates', 'public');
            }

            $template = ContractTemplate::query()->create($validated);
            $this->syncArticles($template, $articles);
        });

        return back()->with('success', __('contracts.actions.created'));
    }

    public function update(Request $request, ContractTemplate $contractTemplate)
    {
        $validated = $this->validateTemplate($request);
        $articles = $validated['articles'];
        unset($validated['articles'], $validated['logo']);

        DB::transaction(function () use ($request, $validated, $articles, $contractTemplate): void {
            if ($validated['is_default']) {
                ContractTemplate::query()
                    ->whereKeyNot($contractTemplate->id)
                    ->update(['is_default' => false]);
            }

            if ($request->hasFile('logo')) {
                if ($contractTemplate->logo_path) {
                    Storage::disk('public')->delete($contractTemplate->logo_path);
                }
                $validated['logo_path'] = $request->file('logo')->store('contract-templates', 'public');
            }

            $contractTemplate->update($validated);
            $this->syncArticles($contractTemplate, $articles);
        });

        return back()->with('success', __('contracts.actions.updated'));
    }

    public function destroy(ContractTemplate $contractTemplate)
    {
        $wasDefault = $contractTemplate->is_default;

        if ($contractTemplate->logo_path) {
            Storage::disk('public')->delete($contractTemplate->logo_path);
        }
        $contractTemplate->delete();

        if ($wasDefault) {
            ContractTemplate::query()->where('is_active', true)->latest()->first()?->update([
                'is_default' => true,
            ]);
        }

        return back()->with('success', __('contracts.actions.deleted'));
    }

    private function validateTemplate(Request $request): array
    {
        return $request->validate([
            'property_id' => ['nullable', 'exists:properties,id'],
            'name' => ['required', 'string', 'max:255'],
            'contract_title' => ['required', 'string', 'max:255'],
            'intro_text' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'max:5120'],
            'landlord_organization' => ['required', 'string', 'max:255'],
            'representative_name' => ['required', 'string', 'max:255'],
            'representative_position' => ['required', 'string', 'max:255'],
            'representative_contact' => ['nullable', 'string', 'max:100'],
            'landlord_signature_label' => ['required', 'string', 'max:255'],
            'tenant_signature_label' => ['required', 'string', 'max:255'],
            'witness_signature_label' => ['required', 'string', 'max:255'],
            'footer_text' => ['nullable', 'string', 'max:3000'],
            'is_default' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'articles' => ['required', 'array', 'min:1', 'max:50'],
            'articles.*.article_number' => ['required', 'string', 'max:30'],
            'articles.*.title' => ['required', 'string', 'max:255'],
            'articles.*.body' => ['required', 'string', 'max:10000'],
            'articles.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ]);
    }

    private function syncArticles(ContractTemplate $template, array $articles): void
    {
        $template->articles()->delete();

        foreach (array_values($articles) as $index => $article) {
            $template->articles()->create([
                'article_number' => $article['article_number'],
                'title' => $article['title'],
                'body' => $article['body'],
                'sort_order' => $index + 1,
            ]);
        }
    }
}
