<?php

namespace App\Observers;

use App\Models\Branch;
use App\Services\Caching\CatalogCacheService;

class BranchObserver
{
    public function saved(Branch $branch): void
    {
        app(CatalogCacheService::class)->invalidateBranch($branch);
    }

    public function deleted(Branch $branch): void
    {
        app(CatalogCacheService::class)->invalidateBranch($branch);
    }
}
