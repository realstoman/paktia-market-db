<?php

namespace App\Observers;

use App\Models\Kitchen;
use App\Services\Caching\CatalogCacheService;

class KitchenObserver
{
    public function saved(Kitchen $kitchen): void
    {
        app(CatalogCacheService::class)->invalidateKitchen($kitchen);
    }

    public function deleted(Kitchen $kitchen): void
    {
        app(CatalogCacheService::class)->invalidateKitchen($kitchen);
    }
}
