<?php

namespace App\Providers;

use App\Models\Branch;
use App\Models\Kitchen;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Observers\BranchObserver;
use App\Observers\KitchenObserver;
use App\Observers\ProductCategoryObserver;
use App\Observers\ProductObserver;
use App\Observers\ProductTypeObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Product::observe(ProductObserver::class);
        ProductCategory::observe(ProductCategoryObserver::class);
        ProductType::observe(ProductTypeObserver::class);
        Kitchen::observe(KitchenObserver::class);
        Branch::observe(BranchObserver::class);

        Gate::before(function ($user, string $ability) {
            return method_exists($user, 'hasRole') && $user->hasRole('super-admin')
                ? true
                : null;
        });
    }
}
