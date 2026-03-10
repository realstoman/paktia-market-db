<?php

namespace App\Services\Product;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ProductApiService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDirection = $filters['sort_direction'] ?? 'asc';

        $query = Product::query()
            ->with(['category', 'kitchen', 'images', 'sizes'])
            ->withCount('images');

        $this->applyFilters($query, $filters);

        return $query
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getById(Product $product): Product
    {
        return $product->load(['category', 'kitchen', 'images', 'sizes'])
            ->loadCount('images');
    }

    public function categories(): Collection
    {
        return ProductCategory::query()
            ->withCount('products')
            ->orderBy('name')
            ->get();
    }

    public function category(ProductCategory $category): ProductCategory
    {
        return $category->loadCount('products');
    }

    public function productsByCategory(ProductCategory $category): LengthAwarePaginator
    {
        return Product::query()
            ->with(['category', 'kitchen', 'images', 'sizes'])
            ->withCount('images')
            ->where('product_category_id', $category->id)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();
    }

    public function types(): Collection
    {
        return ProductType::query()
            ->orderBy('name')
            ->get()
            ->map(function (ProductType $type) {
                $type->setAttribute('products_count', Product::where('type', $type->name)->count());

                return $type;
            });
    }

    public function type(ProductType $type): ProductType
    {
        $type->setAttribute('products_count', Product::where('type', $type->name)->count());

        return $type;
    }

    public function productsByType(ProductType $type): LengthAwarePaginator
    {
        return Product::query()
            ->with(['category', 'kitchen', 'images', 'sizes'])
            ->withCount('images')
            ->where('type', $type->name)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $query
            ->when(
                $filters['category_id'] ?? null,
                fn (Builder $q, int $categoryId) => $q->where('product_category_id', $categoryId)
            )
            ->when(
                $filters['type'] ?? null,
                fn (Builder $q, string $type) => $q->where('type', strtolower(trim($type)))
            )
            ->when(
                $filters['kitchen_id'] ?? null,
                fn (Builder $q, int $kitchenId) => $q->where('kitchen_id', $kitchenId)
            )
            ->when(
                array_key_exists('is_active', $filters),
                fn (Builder $q) => $q->where('is_active', (bool) $filters['is_active'])
            )
            ->when(
                $filters['q'] ?? null,
                function (Builder $q, string $term): void {
                    $q->where(function (Builder $searchQuery) use ($term): void {
                        $searchQuery
                            ->where('name', 'like', "%{$term}%")
                            ->orWhere('pashto_name', 'like', "%{$term}%")
                            ->orWhere('dari_name', 'like', "%{$term}%");
                    });
                }
            );
    }
}
