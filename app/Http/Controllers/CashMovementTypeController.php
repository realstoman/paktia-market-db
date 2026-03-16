<?php

namespace App\Http\Controllers;

use App\Models\CashMovement;
use App\Models\CashMovementType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CashMovementTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('finance/cash-movement-types/index', [
            'movementTypes' => CashMovementType::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateType($request);

        CashMovementType::create([
            'name' => $validated['name'],
            'slug' => $this->makeSlug($validated['slug'] ?? $validated['name']),
            'default_direction' => $validated['default_direction'] ?? null,
            'requires_counterparty' => $validated['requires_counterparty'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('finance.cash-movement-types.index')
            ->with('success', 'Movement type created successfully.');
    }

    public function update(Request $request, CashMovementType $cashMovementType)
    {
        $validated = $this->validateType($request, $cashMovementType);

        $cashMovementType->update([
            'name' => $validated['name'],
            'slug' => $this->makeSlug($validated['slug'] ?? $validated['name']),
            'default_direction' => $validated['default_direction'] ?? null,
            'requires_counterparty' => $validated['requires_counterparty'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('finance.cash-movement-types.index')
            ->with('success', 'Movement type updated successfully.');
    }

    public function destroy(CashMovementType $cashMovementType)
    {
        if (CashMovement::query()->where('movement_type', $cashMovementType->slug)->exists()) {
            $cashMovementType->update(['is_active' => false]);

            return redirect()
                ->route('finance.cash-movement-types.index')
                ->with('success', 'Movement type deactivated because it is already used.');
        }

        $cashMovementType->delete();

        return redirect()
            ->route('finance.cash-movement-types.index')
            ->with('success', 'Movement type deleted successfully.');
    }

    protected function validateType(Request $request, ?CashMovementType $type = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('cash_movement_types', 'slug')->ignore($type?->id),
            ],
            'default_direction' => ['nullable', Rule::in(['in', 'out'])],
            'requires_counterparty' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    protected function makeSlug(string $value): string
    {
        return str($value)
            ->trim()
            ->lower()
            ->replace(['/', ' '], ['_', '_'])
            ->replace('-', '_')
            ->value();
    }
}
