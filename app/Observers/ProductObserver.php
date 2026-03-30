<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\Caching\CatalogCacheService;

class ProductObserver
{
    public function saved(Product $product): void
    {
        app(CatalogCacheService::class)->invalidateCatalog($product);
    }

    public function deleted(Product $product): void
    {
        app(CatalogCacheService::class)->invalidateCatalog($product);
    }
}
