<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Location\BranchController;
use App\Http\Controllers\Location\BranchTableController;
use App\Http\Controllers\Location\CountryController;
use App\Http\Controllers\Location\ProvinceController;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
})->middleware('guest');

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', function (Request $request) {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $selectedDate = Carbon::parse(
            $validated['date'] ?? Carbon::today()->toDateString(),
        );
        $selectedDateString = $selectedDate->toDateString();

        $orderStats = [
            'pending' => 0,
            'in_progress' => 0,
            'ready' => 0,
            'completed' => 0,
            'cancelled' => 0,
        ];

        $analyticsReferenceDate = Carbon::today();
        $analyticsStartDate = $analyticsReferenceDate->copy()->subDays(6)->startOfDay();
        $analyticsEndDate = $analyticsReferenceDate->copy()->endOfDay();
        $analyticsRows = Order::query()
            ->selectRaw('DATE(created_at) as order_date, status, COUNT(*) as total')
            ->whereBetween('created_at', [$analyticsStartDate, $analyticsEndDate])
            ->groupBy(DB::raw('DATE(created_at)'), 'status')
            ->get();
        $recentOrders = Order::query()
            ->with(['items.product'])
            ->withCount('items')
            ->orderByDesc('id')
            ->limit(8)
            ->get();
        $topOrderedDishes = OrderItem::query()
            ->selectRaw('products.name as product_name')
            ->selectRaw('product_categories.name as category_name')
            ->selectRaw('SUM(order_items.quantity) as total_quantity')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join(
                'product_categories',
                'product_categories.id',
                '=',
                'products.product_category_id',
            )
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', '!=', 'cancelled')
            ->groupBy('products.id', 'products.name', 'product_categories.name')
            ->orderByDesc('total_quantity')
            ->limit(6)
            ->get();

        $analyticsByDate = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = $analyticsReferenceDate->copy()->subDays($i);
            $dateKey = $date->toDateString();

            $analyticsByDate[$dateKey] = [
                'date' => $dateKey,
                'day' => $date->format('D'),
                'pending' => 0,
                'preparing' => 0,
                'ready' => 0,
                'completed' => 0,
                'cancelled' => 0,
            ];
        }

        foreach ($analyticsRows as $row) {
            $dateKey = (string) $row->order_date;
            $status = (string) $row->status;
            $count = (int) $row->total;

            if (! isset($analyticsByDate[$dateKey])) {
                continue;
            }

            if ($status === 'in_progress') {
                $analyticsByDate[$dateKey]['preparing'] += $count;
            } elseif (array_key_exists($status, $orderStats)) {
                $analyticsByDate[$dateKey][$status] += $count;
            }

            if ($dateKey === $selectedDateString) {
                if ($status === 'in_progress') {
                    $orderStats['in_progress'] += $count;
                } elseif (array_key_exists($status, $orderStats)) {
                    $orderStats[$status] += $count;
                }
            }
        }

        return Inertia::render('dashboard', [
            'data' => [
                'orders' => $orderStats,
                'orderAnalytics' => array_values($analyticsByDate),
                'recentOrders' => $recentOrders,
                'topOrderedDishes' => $topOrderedDishes,
                'selectedDate' => $selectedDateString,
            ],
        ]);
    })->name('dashboard');

    // Users
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/block', [UserController::class, 'toggleBlock'])->name('users.block');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    // Route::post('users/{user}/permissions', [UserPermissionController::class, 'store']);
    // Route::delete('users/{user}/permissions', [UserPermissionController::class, 'destroy']);

    // Roles & Permissions
    Route::resource('roles', RoleController::class);
    Route::get('permissions', [PermissionController::class, 'index']);
    Route::post('permissions', [PermissionController::class, 'store'])->name('permissions.store');

    // Locations
    Route::resource('countries', CountryController::class);
    Route::post('countries/{country}/disable', [CountryController::class, 'disable'])->name('countries.disable');
    Route::resource('provinces', ProvinceController::class);
    Route::resource('branches', BranchController::class);
    Route::post('branch-tables', [BranchTableController::class, 'store'])->name('branch-tables.store');
    Route::put('branch-tables/{branchTable}', [BranchTableController::class, 'update'])->name('branch-tables.update');
    Route::delete('branch-tables/{branchTable}', [BranchTableController::class, 'destroy'])->name('branch-tables.destroy');
    Route::post('branches/{branch}/kitchens', [BranchController::class, 'syncKitchens'])->name('branches.kitchens');
    Route::resource('kitchens', KitchenController::class);
    Route::post('kitchens/{kitchen}/toggle', [KitchenController::class, 'toggle'])->name('kitchens.toggle');
    Route::post('kitchens/{kitchen}/products', [KitchenController::class, 'syncProducts'])->name('kitchens.products');
    Route::post('branches/{branch}/disable', [BranchController::class, 'disable'])->name('branches.disable');

    // Products & Orders
    Route::resource('products', ProductController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('products/categories', [ProductController::class, 'storeCategory'])->name('products.categories.store');
    Route::delete('products/categories/{category}', [ProductController::class, 'destroyCategory'])->name('products.categories.destroy');
    Route::post('products/types', [ProductController::class, 'storeType'])->name('products.types.store');
    Route::delete('products/types/{type}', [ProductController::class, 'destroyType'])->name('products.types.destroy');
    Route::delete('products/{product}/images/{productImage}', [ProductController::class, 'destroyImage'])->name('products.images.destroy');
    Route::resource('orders', OrderController::class)->only(['index', 'store']);
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
    Route::patch('orders/{order}/table', [OrderController::class, 'updateTable'])->name('orders.table.update');
    Route::post('orders/{order}/items', [OrderController::class, 'addItems'])->name('orders.items.store');

    // Inventory
    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::put('inventory/{inventory}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::post('inventory/{inventory}/restock', [InventoryController::class, 'restock'])->name('inventory.restock');
    Route::post('inventory/vendors', [InventoryController::class, 'storeVendor'])->name('inventory.vendors.store');
    Route::put('inventory/vendors/{vendor}', [InventoryController::class, 'updateVendor'])->name('inventory.vendors.update');
    Route::get('finance', [FinanceController::class, 'index'])->name('finance.index');

    // API helpers
    Route::get('countries/{country}/provinces', [ProvinceController::class, 'byCountry']);
});

require __DIR__.'/settings.php';


/*
|--------------------------------------------------------------------------
| Block Registration (IMPORTANT)
|--------------------------------------------------------------------------
*/

// If someone tries /register → redirect to login
Route::any('/register', function () {
    return redirect()->route('login');
});
