<?php

namespace App\Services\Caching;

use App\Models\Branch;
use App\Models\Kitchen;
use App\Models\Product;

class CatalogCacheService
{
    public const TOOL_REFERENCE_NAMESPACE = 'tool-reference';
    public const PRODUCT_CATEGORIES_NAMESPACE = 'product-categories';
    public const PRODUCT_TYPES_NAMESPACE = 'product-types';
    public const BRANCH_MENU_NAMESPACE = 'branch-menu';

    public function __construct(private readonly PosCacheService $cache) {}

    public function rememberToolReference(callable $callback): array
    {
        return $this->cache->remember(
            self::TOOL_REFERENCE_NAMESPACE,
            ['all'],
            config('pos.cache.ttl_seconds.tool_reference', 300),
            $callback(...),
        );
    }

    public function rememberProductCategories(callable $callback): mixed
    {
        return $this->cache->remember(
            self::PRODUCT_CATEGORIES_NAMESPACE,
            ['all'],
            config('pos.cache.ttl_seconds.product_categories', 300),
            $callback(...),
        );
    }

    public function rememberProductTypes(callable $callback): mixed
    {
        return $this->cache->remember(
            self::PRODUCT_TYPES_NAMESPACE,
            ['all'],
            config('pos.cache.ttl_seconds.product_types', 300),
            $callback(...),
        );
    }

    public function invalidateCatalog(?Product $product = null): void
    {
        $this->cache->invalidate(self::PRODUCT_CATEGORIES_NAMESPACE);
        $this->cache->invalidate(self::PRODUCT_TYPES_NAMESPACE);
        $this->cache->invalidate(self::TOOL_REFERENCE_NAMESPACE);
        $this->cache->invalidate(self::BRANCH_MENU_NAMESPACE);

        if ($product?->kitchen) {
            $this->invalidateKitchen($product->kitchen);
        }
    }

    public function invalidateBranch(?Branch $branch = null): void
    {
        $this->cache->invalidate(self::TOOL_REFERENCE_NAMESPACE);
        $this->cache->invalidate(self::BRANCH_MENU_NAMESPACE);

        if ($branch) {
            foreach ($branch->kitchens as $kitchen) {
                $this->invalidateKitchen($kitchen);
            }
        }
    }

    public function invalidateKitchen(?Kitchen $kitchen = null): void
    {
        $this->cache->invalidate(self::TOOL_REFERENCE_NAMESPACE);
        $this->cache->invalidate(self::BRANCH_MENU_NAMESPACE);

        if (! $kitchen) {
            return;
        }

        $kitchen->loadMissing('branches');

        foreach ($kitchen->branches as $branch) {
            $this->cache->invalidate(self::BRANCH_MENU_NAMESPACE);
        }
    }

    public function invalidateReferenceData(): void
    {
        $this->cache->invalidate(self::TOOL_REFERENCE_NAMESPACE);
        $this->cache->invalidate(self::PRODUCT_CATEGORIES_NAMESPACE);
        $this->cache->invalidate(self::PRODUCT_TYPES_NAMESPACE);
        $this->cache->invalidate(self::BRANCH_MENU_NAMESPACE);
    }
}
