<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Location\BranchController;
use App\Http\Controllers\Location\BranchTableController;
use App\Http\Controllers\Location\CountryController;
use App\Http\Controllers\Location\ProvinceController;
use App\Models\InventoryItem;
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
            $status = $row->status instanceof \BackedEnum
                ? $row->status->value
                : (string) $row->status;
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

        $inventoryItems = InventoryItem::query()->get();
        $totalInventoryItems = $inventoryItems->count();
        $totalFixedItems = $inventoryItems
            ->filter(fn (InventoryItem $item) => str($item->type)->lower()->trim()->value() === 'fixed')
            ->count();
        $totalUsableItems = $inventoryItems
            ->filter(fn (InventoryItem $item) => (bool) $item->is_usable)
            ->count();
        $lowStockItems = $inventoryItems
            ->filter(fn (InventoryItem $item) => (float) $item->quantity > 0 && (float) $item->quantity <= 10)
            ->count();
        $outOfStockItems = $inventoryItems
            ->filter(fn (InventoryItem $item) => (float) $item->quantity <= 0)
            ->count();

        $inventoryValue = 0.0;
        $amountOwedToVendors = 0.0;

        foreach ($inventoryItems as $item) {
            $quantity = (float) $item->quantity;
            $unitPrice = (float) ($item->unit_price ?? 0);
            $paidAmount = (float) ($item->paid_amount ?? 0);
            $itemTotal = $quantity * $unitPrice;

            $inventoryValue += $itemTotal;
            $amountOwedToVendors += max(0, $itemTotal - $paidAmount);
        }

        $inventoryPie = [
            ['key' => 'usable', 'label' => 'Usable', 'value' => $totalUsableItems],
            ['key' => 'fixed', 'label' => 'Fixed', 'value' => $totalFixedItems],
            ['key' => 'other', 'label' => 'Other', 'value' => max(0, $totalInventoryItems - $totalUsableItems - $totalFixedItems)],
        ];

        return Inertia::render('dashboard', [
            'data' => [
                'orders' => $orderStats,
                'orderAnalytics' => array_values($analyticsByDate),
                'recentOrders' => $recentOrders,
                'topOrderedDishes' => $topOrderedDishes,
                'selectedDate' => $selectedDateString,
                'inventory' => [
                    'totalItems' => $totalInventoryItems,
                    'totalFixedItems' => $totalFixedItems,
                    'totalUsableItems' => $totalUsableItems,
                    'lowStockItems' => $lowStockItems,
                    'outOfStockItems' => $outOfStockItems,
                    'inventoryValue' => round($inventoryValue, 2),
                    'amountOwedToVendors' => round($amountOwedToVendors, 2),
                    'pie' => $inventoryPie,
                ],
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
    Route::post('kitchen-types', [KitchenController::class, 'storeKitchenType'])->name('kitchen-types.store');
    Route::put('kitchen-types/{kitchenType}', [KitchenController::class, 'updateKitchenType'])->name('kitchen-types.update');
    Route::delete('kitchen-types/{kitchenType}', [KitchenController::class, 'destroyKitchenType'])->name('kitchen-types.destroy');
    Route::post('cuisines', [KitchenController::class, 'storeCuisine'])->name('cuisines.store');
    Route::put('cuisines/{cuisine}', [KitchenController::class, 'updateCuisine'])->name('cuisines.update');
    Route::delete('cuisines/{cuisine}', [KitchenController::class, 'destroyCuisine'])->name('cuisines.destroy');
    Route::post('branches/{branch}/disable', [BranchController::class, 'disable'])->name('branches.disable');

    // Products & Orders
    Route::resource('products', ProductController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('products/categories', [ProductController::class, 'storeCategory'])->name('products.categories.store');
    Route::put('products/categories/{category}', [ProductController::class, 'updateCategory'])->name('products.categories.update');
    Route::delete('products/categories/{category}', [ProductController::class, 'destroyCategory'])->name('products.categories.destroy');
    Route::post('products/types', [ProductController::class, 'storeType'])->name('products.types.store');
    Route::put('products/types/{type}', [ProductController::class, 'updateType'])->name('products.types.update');
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
    Route::delete('inventory/{inventory}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
    Route::post('inventory/{inventory}/restock', [InventoryController::class, 'restock'])->name('inventory.restock');
    Route::post('inventory/usage-cycle', [InventoryController::class, 'storeUsageCycle'])->name('inventory.usage-cycle.store');
    Route::post('vendors', [InventoryController::class, 'storeVendor'])->name('vendors.store');
    Route::put('vendors/{vendor}', [InventoryController::class, 'updateVendor'])->name('vendors.update');
    Route::delete('vendors/{vendor}', [InventoryController::class, 'destroyVendor'])->name('vendors.destroy');
    Route::post('currencies', [InventoryController::class, 'storeCurrency'])->name('currencies.store');
    Route::put('currencies/{currency}', [InventoryController::class, 'updateCurrency'])->name('currencies.update');
    Route::delete('currencies/{currency}', [InventoryController::class, 'destroyCurrency'])->name('currencies.destroy');
    Route::post('units', [InventoryController::class, 'storeUnit'])->name('units.store');
    Route::put('units/{unit}', [InventoryController::class, 'updateUnit'])->name('units.update');
    Route::delete('units/{unit}', [InventoryController::class, 'destroyUnit'])->name('units.destroy');
    Route::post('inventory-types', [InventoryController::class, 'storeInventoryType'])->name('inventory-types.store');
    Route::put('inventory-types/{inventoryType}', [InventoryController::class, 'updateInventoryType'])->name('inventory-types.update');
    Route::delete('inventory-types/{inventoryType}', [InventoryController::class, 'destroyInventoryType'])->name('inventory-types.destroy');
    Route::post('inventory-categories', [InventoryController::class, 'storeInventoryCategory'])->name('inventory-categories.store');
    Route::put('inventory-categories/{inventoryCategory}', [InventoryController::class, 'updateInventoryCategory'])->name('inventory-categories.update');
    Route::delete('inventory-categories/{inventoryCategory}', [InventoryController::class, 'destroyInventoryCategory'])->name('inventory-categories.destroy');
    Route::get('finance', [FinanceController::class, 'index'])->name('finance.index');

    // Employees
    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::post('employees/{employee}/toggle-active', [EmployeeController::class, 'toggleActive'])->name('employees.toggle-active');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('employee-positions', [EmployeeController::class, 'storePosition'])->name('employee-positions.store');
    Route::put('employee-positions/{employeePosition}', [EmployeeController::class, 'updatePosition'])->name('employee-positions.update');
    Route::delete('employee-positions/{employeePosition}', [EmployeeController::class, 'destroyPosition'])->name('employee-positions.destroy');
    Route::post('employment-types', [EmployeeController::class, 'storeEmploymentType'])->name('employment-types.store');
    Route::put('employment-types/{employmentType}', [EmployeeController::class, 'updateEmploymentType'])->name('employment-types.update');
    Route::delete('employment-types/{employmentType}', [EmployeeController::class, 'destroyEmploymentType'])->name('employment-types.destroy');
    Route::post('shifts', [EmployeeController::class, 'storeShift'])->name('shifts.store');
    Route::put('shifts/{shift}', [EmployeeController::class, 'updateShift'])->name('shifts.update');
    Route::delete('shifts/{shift}', [EmployeeController::class, 'destroyShift'])->name('shifts.destroy');

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
