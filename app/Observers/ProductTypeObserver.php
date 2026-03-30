<?php

namespace App\Observers;

use App\Models\ProductType;
use App\Services\Caching\CatalogCacheService;

class ProductTypeObserver
{
    public function saved(ProductType $productType): void
    {
        app(CatalogCacheService::class)->invalidateReferenceData();
    }

    public function deleted(ProductType $productType): void
    {
        app(CatalogCacheService::class)->invalidateReferenceData();
    }
}
