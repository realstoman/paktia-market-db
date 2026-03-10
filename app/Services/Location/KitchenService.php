<?php

namespace App\Services\Location;

use App\Models\Branch;
use App\Models\Cuisine;
use App\Models\Kitchen;
use App\Models\KitchenCategory;
use App\Models\KitchenType;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class KitchenService
{
    public function getIndexData(): array
    {
        $kitchens = Kitchen::with(['branches', 'products', 'kitchenType', 'cuisines', 'kitchenCategories'])->get();

        $kitchens->transform(function (Kitchen $kitchen) {
            return [
                'id' => $kitchen->id,
                'name' => $kitchen->name,
                'type' => $kitchen->kitchenType?->name,
                'kitchen_type' => $kitchen->kitchenType?->name,
                'kitchen_type_id' => $kitchen->kitchen_type_id,
                'cuisines' => $kitchen->cuisines->map(fn (Cuisine $cuisine) => [
                    'id' => $cuisine->id,
                    'name' => $cuisine->name,
                    'description' => $cuisine->description,
                ])->values(),
                'cuisines_label' => $kitchen->cuisines->pluck('name')->join(', '),
                'kitchen_categories' => $kitchen->kitchenCategories->map(fn (KitchenCategory $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                ])->values(),
                'kitchen_categories_label' => $kitchen->kitchenCategories->pluck('name')->join(', '),
                'is_active' => $kitchen->is_active,
                'branch_id' => $kitchen->branch_id,
                'branches' => $kitchen->branches,
                'products' => $kitchen->products,
                'created_at' => $kitchen->created_at,
                'updated_at' => $kitchen->updated_at,
            ];
        });

        return [
            'kitchens' => $kitchens,
            'branches' => Branch::orderBy('name')->get(),
            'products' => Product::orderBy('name')->get(['id', 'name', 'kitchen_id']),
            'kitchenTypes' => KitchenType::orderBy('name')->get(['id', 'name', 'description']),
            'cuisines' => Cuisine::orderBy('name')->get(['id', 'name', 'description']),
            'kitchenCategories' => KitchenCategory::orderBy('name')->get(['id', 'name', 'description']),
        ];
    }

    public function create(array $data): Kitchen
    {
        return DB::transaction(function () use ($data) {
            $cuisineIds = $data['cuisines'] ?? [];
            $kitchenCategoryIds = $data['kitchen_categories'] ?? [];
            unset($data['cuisines']);
            unset($data['kitchen_categories']);

            $kitchen = Kitchen::create([
                ...$data,
                'type' => null,
            ]);
            $kitchen->cuisines()->sync($cuisineIds);
            $kitchen->kitchenCategories()->sync($kitchenCategoryIds);

            return $kitchen->load(['kitchenType', 'cuisines', 'kitchenCategories']);
        });
    }

    public function update(Kitchen $kitchen, array $data): Kitchen
    {
        return DB::transaction(function () use ($kitchen, $data) {
            $cuisineIds = $data['cuisines'] ?? [];
            $kitchenCategoryIds = $data['kitchen_categories'] ?? [];
            unset($data['cuisines']);
            unset($data['kitchen_categories']);

            $kitchen->update([
                ...$data,
                'type' => null,
            ]);
            $kitchen->cuisines()->sync($cuisineIds);
            $kitchen->kitchenCategories()->sync($kitchenCategoryIds);

            return $kitchen->load(['kitchenType', 'cuisines', 'kitchenCategories']);
        });
    }

    public function toggleActive(Kitchen $kitchen): Kitchen
    {
        $kitchen->update(['is_active' => ! $kitchen->is_active]);
        return $kitchen;
    }

    public function delete(Kitchen $kitchen): void
    {
        $kitchen->delete();
    }
}
