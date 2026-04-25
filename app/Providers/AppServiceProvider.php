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
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
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

        $this->configureModelSafety();
    }

    /**
     * Surface accidental N+1 / silent attribute access in non-production by
     * logging a warning. We deliberately do not throw — that would turn
     * latent bugs into hard errors in dev and break long-running tasks.
     */
    private function configureModelSafety(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        if ($this->app->isProduction()) {
            return;
        }

        Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation): void {
            $class = get_class($model);
            Log::warning("Lazy-loaded relation [{$relation}] on [{$class}].");
        });

        Model::handleMissingAttributeViolationUsing(function (Model $model, string $key): void {
            $class = get_class($model);
            Log::warning("Accessed missing attribute [{$key}] on [{$class}].");
        });

        Model::handleDiscardedAttributeViolationUsing(function (Model $model, array $attributes): void {
            $class = get_class($model);
            Log::warning(
                "Discarded attributes on [{$class}]: ".implode(', ', $attributes)
            );
        });
    }
}
