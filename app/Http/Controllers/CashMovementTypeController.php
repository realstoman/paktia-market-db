<?php

namespace App\Http\Controllers;

use App\Models\CashMovement;
use App\Models\CashMovementType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CashMovementTypeController extends Controller
{
    private function authorizeDelete(Request $request): void
    {
        abort_unless($request->user()?->hasRole('super-admin') === true, 403);
    }

    public function index()
    {
        $movementCounts = CashMovement::query()
            ->selectRaw('movement_type, COUNT(*) as aggregate')
            ->groupBy('movement_type')
            ->pluck('aggregate', 'movement_type');

        $movementTypes = CashMovementType::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->each(function (CashMovementType $type) use ($movementCounts) {
                $type->movement_count = (int) ($movementCounts[$type->slug] ?? 0);
            });

        return Inertia::render('finance/cash-movement-types/index', [
            'movementTypes' => $movementTypes,
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

    public function destroy(Request $request, CashMovementType $cashMovementType)
    {
        $this->authorizeDelete($request);

        if (CashMovement::query()->where('movement_type', $cashMovementType->slug)->exists()) {
            $replacementTypeId = $request->integer('replacement_movement_type_id');

            if (! $replacementTypeId || $replacementTypeId === $cashMovementType->id) {
                throw ValidationException::withMessages([
                    'replacement_movement_type_id' => 'Select another movement type before deleting this one.',
                ]);
            }

            $replacementType = CashMovementType::query()
                ->whereKeyNot($cashMovementType->id)
                ->find($replacementTypeId);

            if (! $replacementType) {
                throw ValidationException::withMessages([
                    'replacement_movement_type_id' => 'Create or select another movement type before deleting this one.',
                ]);
            }

            CashMovement::query()
                ->where('movement_type', $cashMovementType->slug)
                ->update(['movement_type' => $replacementType->slug]);

            $cashMovementType->delete();

            return redirect()
                ->route('finance.cash-movement-types.index')
                ->with('success', 'Movement type reassigned and deleted successfully.');
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
