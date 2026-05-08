<?php

namespace App\Services\Product;

use App\Models\Cuisine;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use Illuminate\Support\Collection;

class DigitalTabletMenuProductService
{
    public function all(): Collection
    {
        return $this->applyTypeIds(
            $this->baseQuery()
            ->orderBy('product_category_id')
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
            $this->baseQuery()
                ->where('cuisine_id', $cuisine->id)
                ->orderBy('product_category_id')
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
            $this->baseQuery()
                ->whereRaw('LOWER(TRIM(type)) = ?', [strtolower(trim($type->name))])
                ->orderBy('product_category_id')
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

        return $products->map(function (Product $product) use ($typeIdByName) {
            $normalizedType = strtolower(trim((string) $product->type));

            $product->setAttribute(
                'product_type_id',
                $typeIdByName[$normalizedType] ?? null,
            );

            return $product;
        });
    }
}
