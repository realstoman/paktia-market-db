<?php

namespace App\Services;

use App\Services\Caching\CatalogCacheService;
use App\Models\Banner;
use App\Models\Cuisine;
use App\Models\Country;
use App\Models\Currency;
use App\Models\ExpenseCategory;
use App\Models\Kitchen;
use App\Models\KitchenCategory;
use App\Models\KitchenType;
use App\Models\Product;
use App\Models\Province;
use App\Models\Vendor;
use Illuminate\Support\Facades\Schema;

class ToolReferenceService
{
    public function __construct(
        private readonly CatalogCacheService $catalogCacheService,
    ) {}

    public function all(): array
    {
        return $this->catalogCacheService->rememberToolReference(
            fn (): array => $this->build(),
        );
    }

    private function build(): array
    {
        return [
            'countries' => Schema::hasTable('countries')
                ? Country::query()
                    ->with('provinces')
                    ->orderBy('name')
                    ->get()
                    ->all()
                : [],
            'provinces' => Schema::hasTable('provinces')
                ? Province::query()
                    ->with('country')
                    ->orderBy('name')
                    ->get()
                    ->all()
                : [],
            'currencies' => Schema::hasTable('currencies')
                ? Currency::query()
                    ->orderBy('name')
                    ->get()
                    ->all()
                : [],
            'vendors' => Schema::hasTable('vendors')
                ? Vendor::query()
                    ->orderBy('name')
                    ->get()
                    ->all()
                : [],
            'expenseCategories' => Schema::hasTable('expense_categories')
                ? ExpenseCategory::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug'])
                    ->all()
                : [],
            'banners' => Schema::hasTable('banners')
                ? Banner::query()
                    ->orderBy('sort_order')
                    ->orderByDesc('id')
                    ->get()
                    ->all()
                : [],
            'kitchens' => Schema::hasTable('kitchens')
                ? Kitchen::query()
                    ->with(['branches', 'products', 'kitchenType', 'cuisines', 'kitchenCategories'])
                    ->orderBy('name')
                    ->get()
                    ->map(fn (Kitchen $kitchen) => [
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
                    ])
                    ->values()
                    ->all()
                : [],
            'products' => Schema::hasTable('products')
                ? Product::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'kitchen_id'])
                    ->all()
                : [],
            'kitchenTypes' => Schema::hasTable('kitchen_types')
                ? KitchenType::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'description'])
                    ->all()
                : [],
            'cuisines' => Schema::hasTable('cuisines')
                ? Cuisine::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'description'])
                    ->all()
                : [],
            'kitchenCategories' => Schema::hasTable('kitchen_categories')
                ? KitchenCategory::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'description'])
                    ->all()
                : [],
        ];
    }
}
