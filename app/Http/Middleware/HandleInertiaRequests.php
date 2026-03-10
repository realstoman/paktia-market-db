<?php

namespace App\Http\Middleware;

use App\Models\Cuisine;
use App\Models\Country;
use App\Models\Currency;
use App\Models\Kitchen;
use App\Models\KitchenCategory;
use App\Models\KitchenType;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
            ],
            'tools' => [
                'countries' => Schema::hasTable('countries')
                    ? Country::orderBy('name')->get()
                    : [],
                'currencies' => Schema::hasTable('currencies')
                    ? Currency::orderBy('name')->get()
                    : [],
                'vendors' => Schema::hasTable('vendors')
                    ? Vendor::orderBy('name')->get()
                    : [],
                'kitchens' => Schema::hasTable('kitchens')
                    ? Kitchen::with(['branches', 'products', 'kitchenType', 'cuisines', 'kitchenCategories'])
                        ->orderBy('name')
                        ->get()
                        ->map(fn (Kitchen $kitchen) => [
                            'id' => $kitchen->id,
                            'name' => $kitchen->name,
                            'type' => $kitchen->kitchenType?->name,
                            'kitchen_type' => $kitchen->kitchenType?->name,
                            'kitchen_type_id' => $kitchen->kitchen_type_id,
                            'cuisines' => $kitchen->cuisines->map(fn (Cuisine $cuisine) => [
                                'id' => $cuisine->id,
                                'name' => $cuisine->name,
                                'description' => $cuisine->description,
                            ])->values(),
                            'cuisines_label' => $kitchen->cuisines->pluck('name')->join(', '),
                            'kitchen_categories' => $kitchen->kitchenCategories->map(fn (KitchenCategory $category) => [
                                'id' => $category->id,
                                'name' => $category->name,
                                'description' => $category->description,
                            ])->values(),
                            'kitchen_categories_label' => $kitchen->kitchenCategories->pluck('name')->join(', '),
                            'is_active' => $kitchen->is_active,
                            'branch_id' => $kitchen->branch_id,
                            'branches' => $kitchen->branches,
                            'products' => $kitchen->products,
                            'created_at' => $kitchen->created_at,
                            'updated_at' => $kitchen->updated_at,
                        ])
                        ->values()
                    : [],
                'products' => Schema::hasTable('products')
                    ? Product::orderBy('name')->get(['id', 'name', 'kitchen_id'])
                    : [],
                'kitchenTypes' => Schema::hasTable('kitchen_types')
                    ? KitchenType::orderBy('name')->get(['id', 'name', 'description'])
                    : [],
                'cuisines' => Schema::hasTable('cuisines')
                    ? Cuisine::orderBy('name')->get(['id', 'name', 'description'])
                    : [],
                'kitchenCategories' => Schema::hasTable('kitchen_categories')
                    ? KitchenCategory::orderBy('name')->get(['id', 'name', 'description'])
                    : [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
