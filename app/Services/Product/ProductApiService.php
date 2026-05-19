<?php

namespace App\Services\Product;

use App\Models\Cuisine;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Services\Caching\CatalogCacheService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProductApiService
{
    public function __construct(
        private readonly CatalogCacheService $catalogCacheService,
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDirection = $filters['sort_direction'] ?? 'asc';

        $query = Product::query()
            ->with(['category', 'categories', 'cuisine', 'kitchen', 'images', 'sizes'])
            ->withCount('images');

        $this->applyFilters($query, $filters);

        $products = $query
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $this->applyTypeLocalization($products->getCollection());

        return $products;
    }

    public function getById(Product $product): Product
    {
        $product = $product->load(['category', 'categories', 'cuisine', 'kitchen', 'images', 'sizes'])
            ->loadCount('images');

        $this->applyTypeLocalization(new EloquentCollection([$product]));

        return $product;
    }

    public function categories(): Collection
    {
        return $this->catalogCacheService->rememberProductCategories(
            fn () => ProductCategory::query()
                ->withCount('products')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function category(ProductCategory $category): ProductCategory
    {
        return $category->loadCount('products');
    }

    public function productsByCategory(ProductCategory $category): LengthAwarePaginator
    {
        $products = Product::query()
            ->with(['category', 'categories', 'cuisine', 'kitchen', 'images', 'sizes'])
            ->withCount('images')
            ->whereHas('categories', fn (Builder $query) => $query->where('product_categories.id', $category->id))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $this->applyTypeLocalization($products->getCollection());

        return $products;
    }

    public function cuisines(): Collection
    {
        return Cuisine::query()
            ->withCount('products')
            ->orderBy('name')
            ->get();
    }

    public function cuisine(Cuisine $cuisine): Cuisine
    {
        return $cuisine->loadCount('products');
    }

    public function productsByCuisine(Cuisine $cuisine): LengthAwarePaginator
    {
        $products = Product::query()
            ->with(['category', 'categories', 'cuisine', 'kitchen', 'images', 'sizes'])
            ->withCount('images')
            ->where('cuisine_id', $cuisine->id)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $this->applyTypeLocalization($products->getCollection());

        return $products;
    }

    public function types(): Collection
    {
        return $this->catalogCacheService->rememberProductTypes(
            function () {
                $countsByType = Product::query()
                    ->select('type', DB::raw('COUNT(*) as aggregate'))
                    ->groupBy('type')
                    ->pluck('aggregate', 'type');

                return ProductType::query()
                    ->orderBy('name')
                    ->get()
                    ->map(function (ProductType $type) use ($countsByType) {
                        $type->setAttribute('products_count', (int) ($countsByType[$type->name] ?? 0));

                        return $type;
                    });
            },
        );
    }

    public function type(ProductType $type): ProductType
    {
        $type->setAttribute(
            'products_count',
            Product::query()->where('type', $type->name)->count(),
        );

        return $type;
    }

    public function productsByType(ProductType $type): LengthAwarePaginator
    {
        $products = Product::query()
            ->with(['category', 'categories', 'cuisine', 'kitchen', 'images', 'sizes'])
            ->withCount('images')
            ->where('type', $type->name)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $this->applyTypeLocalization($products->getCollection());

        return $products;
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $query
            ->when(
                $filters['category_id'] ?? null,
                fn (Builder $q, int $categoryId) => $q->whereHas(
                    'categories',
                    fn (Builder $categoryQuery) => $categoryQuery->where('product_categories.id', $categoryId),
                )
            )
            ->when(
                $filters['cuisine_id'] ?? null,
                fn (Builder $q, int $cuisineId) => $q->where('cuisine_id', $cuisineId)
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

    private function applyTypeLocalization(EloquentCollection $products): void
    {
        $typesByName = ProductType::query()
            ->get(['name', 'pashto_name', 'dari_name'])
            ->keyBy(fn (ProductType $type) => strtolower(trim($type->name)));

        $products->each(function (Product $product) use ($typesByName): void {
            $type = $typesByName->get(strtolower(trim((string) $product->type)));

            $product->setAttribute('type_pashto_name', $type?->pashto_name);
            $product->setAttribute('type_dari_name', $type?->dari_name);
        });
    }
}
