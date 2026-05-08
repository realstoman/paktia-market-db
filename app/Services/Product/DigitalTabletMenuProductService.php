<?php

namespace App\Services\Product;

use App\Models\Cuisine;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class DigitalTabletMenuProductService
{
    public function all(): Collection
    {
        return $this->applyTypeIds(
            $this->orderByCategorySort(
                $this->baseQuery()
            )
                ->orderBy('name')
                ->get()
        );
    }

    public function categories(): Collection
    {
        return ProductCategory::query()
            ->whereHas('products', fn ($query) => $query->where('is_active', true))
            ->withCount([
                'products' => fn ($query) => $query->where('is_active', true),
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function cuisines(): Collection
    {
        return Cuisine::query()
            ->whereHas('products', fn ($query) => $query->where('is_active', true))
            ->withCount([
                'products' => fn ($query) => $query->where('is_active', true),
            ])
            ->orderBy('name')
            ->get();
    }

    public function productsByCategory(ProductCategory $category): Collection
    {
        return $this->applyTypeIds(
            $this->baseQuery()
                ->where('product_category_id', $category->id)
                ->orderBy('name')
                ->get()
        );
    }

    public function productsByCuisine(Cuisine $cuisine): Collection
    {
        return $this->applyTypeIds(
            $this->orderByCategorySort(
                $this->baseQuery()
                ->where('cuisine_id', $cuisine->id)
            )
                ->orderBy('name')
                ->get()
        );
    }

    public function types(): Collection
    {
        $typeCounts = $this->baseQuery()
            ->select('type')
            ->whereNotNull('type')
            ->pluck('type')
            ->map(fn ($type) => strtolower(trim((string) $type)))
            ->filter()
            ->countBy();

        return ProductType::query()
            ->when(
                $typeCounts->isNotEmpty(),
                fn ($query) => $query->whereIn('name', $typeCounts->keys()->all()),
                fn ($query) => $query->whereRaw('1 = 0'),
            )
            ->orderBy('name')
            ->get()
            ->map(function (ProductType $type) use ($typeCounts) {
                $type->setAttribute(
                    'products_count',
                    (int) ($typeCounts[strtolower(trim($type->name))] ?? 0),
                );

                return $type;
            });
    }

    public function productsByType(ProductType $type): Collection
    {
        return $this->applyTypeIds(
            $this->orderByCategorySort(
                $this->baseQuery()
                ->whereRaw('LOWER(TRIM(type)) = ?', [strtolower(trim($type->name))])
            )
                ->orderBy('name')
                ->get()
        );
    }

    protected function baseQuery()
    {
        return Product::query()
            ->with(['category', 'cuisine', 'images', 'sizes'])
            ->where('is_active', true);
    }

    protected function orderByCategorySort(Builder $query): Builder
    {
        return $query
            ->orderBy(
                ProductCategory::query()
                    ->select('sort_order')
                    ->whereColumn('product_categories.id', 'products.product_category_id')
                    ->limit(1)
            )
            ->orderBy(
                ProductCategory::query()
                    ->select('name')
                    ->whereColumn('product_categories.id', 'products.product_category_id')
                    ->limit(1)
            );
    }

    protected function typeIdByName(): Collection
    {
        return ProductType::query()
            ->pluck('id', 'name')
            ->mapWithKeys(
                fn ($id, $name) => [strtolower(trim((string) $name)) => (int) $id],
            );
    }

    protected function applyTypeIds(Collection $products): Collection
    {
        $typeIdByName = $this->typeIdByName();
        $typesByName = $this->typeByName();

        return $products->map(function (Product $product) use ($typeIdByName, $typesByName) {
            $normalizedType = strtolower(trim((string) $product->type));
            $type = $typesByName->get($normalizedType);

            $product->setAttribute(
                'product_type_id',
                $typeIdByName[$normalizedType] ?? null,
            );
            $product->setAttribute('product_type_pashto_name', $type?->pashto_name);
            $product->setAttribute('product_type_dari_name', $type?->dari_name);

            return $product;
        });
    }

    protected function typeByName(): Collection
    {
        return ProductType::query()
            ->get(['id', 'name', 'pashto_name', 'dari_name'])
            ->keyBy(fn (ProductType $type) => strtolower(trim($type->name)));
    }
}
