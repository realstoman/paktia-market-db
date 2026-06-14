<?php

namespace App\Services;

use App\Models\Banner;
use App\Models\Country;
use App\Models\Currency;
use App\Models\ExpenseCategory;
use App\Models\Province;
use App\Models\Vendor;
use App\Services\Caching\CatalogCacheService;
use Illuminate\Support\Facades\Schema;

class ToolReferenceService
{
    public function __construct(
        private readonly CatalogCacheService $catalogCacheService,
    ) {}

    public function all(): array
    {
        return $this->catalogCacheService->rememberToolReference(fn (): array => [
            'countries' => Schema::hasTable('countries')
                ? Country::query()->with('provinces')->orderBy('name')->get()->all()
                : [],
            'provinces' => Schema::hasTable('provinces')
                ? Province::query()->with('country')->orderBy('name')->get()->all()
                : [],
            'currencies' => Schema::hasTable('currencies')
                ? Currency::query()->orderBy('name')->get()->all()
                : [],
            'vendors' => Schema::hasTable('vendors')
                ? Vendor::query()->orderBy('name')->get()->all()
                : [],
            'expenseCategories' => Schema::hasTable('expense_categories')
                ? ExpenseCategory::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug'])
                    ->all()
                : [],
            'banners' => Schema::hasTable('banners')
                ? Banner::query()->orderBy('sort_order')->orderByDesc('id')->get()->all()
                : [],
        ]);
    }
}
