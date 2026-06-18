<?php

namespace App\Observers;

use App\Models\Property;
use App\Services\Caching\CatalogCacheService;

class PropertyObserver
{
    public function saved(Property $property): void
    {
        app(CatalogCacheService::class)->invalidateProperty($property);
    }

    public function deleted(Property $property): void
    {
        app(CatalogCacheService::class)->invalidateProperty($property);
    }
}
