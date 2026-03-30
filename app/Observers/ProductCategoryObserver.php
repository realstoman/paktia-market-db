<?php

namespace App\Observers;

use App\Models\ProductCategory;
use App\Services\Caching\CatalogCacheService;

class ProductCategoryObserver
{
    public function saved(ProductCategory $productCategory): void
    {
        app(CatalogCacheService::class)->invalidateReferenceData();
    }

    public function deleted(ProductCategory $productCategory): void
    {
        app(CatalogCacheService::class)->invalidateReferenceData();
    }
}
