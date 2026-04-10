<?php

use App\Enums\PermissionEnum;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\CashBankController;
use App\Http\Controllers\CashMovementTypeController;
use App\Http\Controllers\ChartOfAccountController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeAdvanceController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OperationsRuntimeHealthController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\Settings\LanguageController;
use App\Http\Controllers\ToolReferenceController;
use App\Http\Controllers\Location\BranchController;
use App\Http\Controllers\Location\BranchTableController;
use App\Http\Controllers\Location\CountryController;
use App\Http\Controllers\Location\ProvinceController;
use App\Models\BranchDailyMetric;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Services\Operations\OperationsDashboardService;
use App\Services\Projection\BranchDailyMetricReader;
use App\Services\Projection\ProjectionHealthService;
use App\Services\Product\TopOrderedDishService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
})->middleware('guest');

Route::put('language', [LanguageController::class, 'update'])
    ->name('language.switch');

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('tools/reference-data', ToolReferenceController::class)
        ->name('tools.reference-data');
    Route::get('operations/runtime-health', OperationsRuntimeHealthController::class)
        ->name('operations.runtime-health');

    // Dashboard
    Route::get('dashboard', function (
        Request $request,
        OperationsDashboardService $operationsDashboardService,
        BranchDailyMetricReader $branchDailyMetricReader,
        ProjectionHealthService $projectionHealthService,
        TopOrderedDishService $topOrderedDishService,
    ) {
        $user = $request->user();
        abort_unless($user && $user->can(PermissionEnum::DASHBOARD_VIEW->value), 403);

        if ($user->hasAnyRole(['cashier', 'server', 'order-taker'])) {
            return Inertia::render('operations/index', $operationsDashboardService->build($user));
        }

        $canViewOrders = $user->can(PermissionEnum::ORDERS_VIEW->value);
        $canViewInventory = $user->can(PermissionEnum::INVENTORY_VIEW->value);
        $canViewFinance = $user->can(PermissionEnum::FINANCE_VIEW->value);

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
        $topOrderedDishes = $topOrderedDishService->get(6);

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
            ['key' => 'usable', 'label' => __('dashboard.inventory.usable'), 'value' => $totalUsableItems],
            ['key' => 'fixed', 'label' => __('dashboard.inventory.fixed'), 'value' => $totalFixedItems],
            ['key' => 'other', 'label' => __('dashboard.inventory.other'), 'value' => max(0, $totalInventoryItems - $totalUsableItems - $totalFixedItems)],
        ];

        $lowStockQuickList = $inventoryItems
            ->loadMissing('branch:id,name')
            ->filter(fn (InventoryItem $item) => (float) $item->quantity <= 10)
            ->sortBy(fn (InventoryItem $item) => (float) $item->quantity)
            ->take(5)
            ->values()
            ->map(fn (InventoryItem $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
                'branch' => $item->branch?->name ?? __('dashboard.inventory.unassigned'),
                'status' => (float) $item->quantity <= 0 ? 'out' : 'low',
            ])
            ->all();

        $metricDateRange = BranchDailyMetric::query()
            ->selectRaw('MIN(metric_date) as min_metric_date, MAX(metric_date) as max_metric_date')
            ->first();
        $projectedStartDate = $metricDateRange?->min_metric_date
            ? Carbon::parse($metricDateRange->min_metric_date)->startOfDay()
            : null;
        $projectedEndDate = $metricDateRange?->max_metric_date
            ? Carbon::parse($metricDateRange->max_metric_date)->endOfDay()
            : null;

        $dashboardSalesTotal = $projectedStartDate && $projectedEndDate
            ? $branchDailyMetricReader->sumCompletedSales($projectedStartDate, $projectedEndDate)
            : (float) Order::query()
                ->where('status', 'completed')
                ->sum('total_amount');

        $dashboardExpensesTotal = $projectedStartDate && $projectedEndDate
            ? $branchDailyMetricReader->sumExpenses($projectedStartDate, $projectedEndDate)
            : (float) Expense::query()->sum('amount');

        $dashboardCashSales = Schema::hasTable('payments')
            ? (float) DB::table('payments')
                ->join('orders', 'orders.id', '=', 'payments.order_id')
                ->where('orders.status', 'completed')
                ->where('payments.method', 'cash')
                ->sum('payments.amount')
            : 0.0;

        $dashboardCashExpenses = Schema::hasColumn('expenses', 'payment_method')
            ? (float) DB::table('expenses')
                ->where('payment_method', 'cash')
                ->sum('amount')
            : 0.0;

        $dashboardCashMovementsNet = Schema::hasTable('cash_movements')
            ? (float) DB::table('cash_movements')
                ->where('approval_status', 'approved')
                ->selectRaw(
                    "COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total"
                )
                ->value('total')
            : 0.0;

        $dashboardWeightedCogs = Schema::hasColumn('inventory_transactions', 'total_cost')
            ? (float) DB::table('inventory_transactions')
                ->whereIn('action', ['issue', 'consumed', 'wastage', 'adjustment_out'])
                ->sum('total_cost')
            : null;

        $dashboardGrossProfit = $dashboardWeightedCogs === null
            ? null
            : $dashboardSalesTotal - $dashboardWeightedCogs;

        $dashboardNetProfit = ($dashboardGrossProfit ?? $dashboardSalesTotal) - $dashboardExpensesTotal;
        $dashboardCashPosition = $dashboardCashSales - $dashboardCashExpenses + $dashboardCashMovementsNet;
        $projectionHealth = $projectionHealthService->snapshot(true);
        $monthlyStartDate = Carbon::today()->copy()->subMonths(4)->startOfMonth();
        $monthlyEndDate = Carbon::today()->copy()->endOfMonth();

        $monthlySales = Order::query()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$monthlyStartDate, $monthlyEndDate])
            ->get(['created_at', 'total_amount'])
            ->groupBy(fn ($order) => Carbon::parse($order->created_at)->format('Y-m'))
            ->map(fn ($orders) => (float) $orders->sum('total_amount'));

        $monthlyExpenses = Expense::query()
            ->whereBetween('expense_date', [
                $monthlyStartDate->toDateString(),
                $monthlyEndDate->toDateString(),
            ])
            ->get(['expense_date', 'amount'])
            ->groupBy(fn ($expense) => Carbon::parse($expense->expense_date)->format('Y-m'))
            ->map(fn ($expenses) => (float) $expenses->sum('amount'));

        $monthlyCogs = Schema::hasColumn('inventory_transactions', 'total_cost')
            ? DB::table('inventory_transactions')
                ->whereIn('action', ['issue', 'consumed', 'wastage', 'adjustment_out'])
                ->whereBetween('created_at', [$monthlyStartDate, $monthlyEndDate])
                ->get(['created_at', 'total_cost'])
                ->groupBy(fn ($transaction) => Carbon::parse($transaction->created_at)->format('Y-m'))
                ->map(fn ($transactions) => (float) $transactions->sum('total_cost'))
            : collect();

        $monthlyNetProfit = [];
        $monthCursor = $monthlyStartDate->copy()->startOfMonth();

        while ($monthCursor->lte($monthlyEndDate)) {
            $bucket = $monthCursor->format('Y-m');
            $sales = (float) ($monthlySales[$bucket] ?? 0);
            $expenses = (float) ($monthlyExpenses[$bucket] ?? 0);
            $cogs = $monthlyCogs->isNotEmpty()
                ? (float) ($monthlyCogs[$bucket] ?? 0)
                : null;
            $grossProfit = $cogs === null
                ? $sales
                : $sales - $cogs;

            $monthlyNetProfit[] = [
                'month' => $monthCursor->format('M'),
                'label' => $monthCursor->format('F Y'),
                'monthKey' => $bucket,
                'netProfit' => $grossProfit - $expenses,
            ];

            $monthCursor->addMonth();
        }

        $branchPerformanceStartDate = Carbon::today()->copy()->subDays(29)->startOfDay();
        $branchPerformanceEndDate = Carbon::today()->copy()->endOfDay();

        $branchPerformance = BranchDailyMetric::query()
            ->join('branches', 'branches.id', '=', 'branch_daily_metrics.branch_id')
            ->selectRaw('branches.id as branch_id')
            ->selectRaw('branches.name as branch_name')
            ->selectRaw('COALESCE(SUM(branch_daily_metrics.completed_sales_total), 0) as revenue')
            ->selectRaw('COALESCE(SUM(branch_daily_metrics.completed_orders_total), 0) as completed_orders')
            ->selectRaw('COALESCE(SUM(branch_daily_metrics.expenses_total), 0) as expenses')
            ->whereBetween('branch_daily_metrics.metric_date', [
                $branchPerformanceStartDate->toDateString(),
                $branchPerformanceEndDate->toDateString(),
            ])
            ->groupBy('branches.id', 'branches.name')
            ->orderByDesc('revenue')
            ->limit(3)
            ->get()
            ->map(fn ($row) => [
                'branchId' => (int) $row->branch_id,
                'branchName' => $row->branch_name,
                'revenue' => (float) $row->revenue,
                'completedOrders' => (int) $row->completed_orders,
                'netProfit' => (float) $row->revenue - (float) $row->expenses,
            ])
            ->values()
            ->all();

        $totalOrdersToday = array_sum($orderStats);
        $cancelledRateToday = $totalOrdersToday > 0
            ? round(($orderStats['cancelled'] / $totalOrdersToday) * 100, 1)
            : 0.0;

        $attentionItems = collect([
            $projectionHealth['criticalBranchCount'] > 0
                ? [
                    'title' => __('dashboard.attention.critical_projection_branches_title'),
                    'detail' => __('dashboard.attention.critical_projection_branches_detail', [
                        'count' => $projectionHealth['criticalBranchCount'],
                    ]),
                    'level' => 'critical',
                ]
                : null,
            $projectionHealth['warningBranchCount'] > 0
                ? [
                    'title' => __('dashboard.attention.projection_warnings_title'),
                    'detail' => __('dashboard.attention.projection_warnings_detail', [
                        'count' => $projectionHealth['warningBranchCount'],
                    ]),
                    'level' => 'warning',
                ]
                : null,
            $outOfStockItems > 0
                ? [
                    'title' => __('dashboard.attention.out_of_stock_title'),
                    'detail' => __('dashboard.attention.out_of_stock_detail', [
                        'count' => $outOfStockItems,
                    ]),
                    'level' => 'critical',
                ]
                : null,
            $lowStockItems > 0
                ? [
                    'title' => __('dashboard.attention.low_stock_title'),
                    'detail' => __('dashboard.attention.low_stock_detail', [
                        'count' => $lowStockItems,
                    ]),
                    'level' => 'warning',
                ]
                : null,
            $cancelledRateToday >= 10
                ? [
                    'title' => __('dashboard.attention.cancellation_rate_title'),
                    'detail' => __('dashboard.attention.cancellation_rate_detail', [
                        'rate' => $cancelledRateToday,
                    ]),
                    'level' => 'warning',
                ]
                : null,
            $amountOwedToVendors > 0
                ? [
                    'title' => __('dashboard.attention.vendor_balances_title'),
                    'detail' => __('dashboard.attention.vendor_balances_detail', [
                        'amount' => number_format($amountOwedToVendors, 0),
                    ]),
                    'level' => 'info',
                ]
                : null,
        ])->filter()->take(4)->values()->all();

        return Inertia::render('dashboard', [
            'data' => [
                'orders' => $canViewOrders ? $orderStats : null,
                'orderAnalytics' => $canViewOrders ? array_values($analyticsByDate) : [],
                'recentOrders' => $canViewOrders ? $recentOrders : [],
                'topOrderedDishes' => $canViewOrders ? $topOrderedDishes : [],
                'selectedDate' => $selectedDateString,
                'inventory' => $canViewInventory ? [
                    'totalItems' => $totalInventoryItems,
                    'totalFixedItems' => $totalFixedItems,
                    'totalUsableItems' => $totalUsableItems,
                    'lowStockItems' => $lowStockItems,
                    'outOfStockItems' => $outOfStockItems,
                    'inventoryValue' => round($inventoryValue, 2),
                    'amountOwedToVendors' => round($amountOwedToVendors, 2),
                    'pie' => $inventoryPie,
                    'lowStockQuickList' => $lowStockQuickList,
                ] : null,
                'finance' => $canViewFinance ? [
                    'netProfit' => (float) $dashboardNetProfit,
                    'expenses' => (float) $dashboardExpensesTotal,
                    'cashPosition' => (float) $dashboardCashPosition,
                    'projectionHealth' => $projectionHealth,
                    'monthlyNetProfit' => $monthlyNetProfit,
                    'branchPerformance' => $branchPerformance,
                    'notes' => [
                        'netProfit' => $dashboardGrossProfit === null
                            ? __('dashboard.notes.net_profit_without_cogs')
                            : __('dashboard.notes.net_profit_with_cogs'),
                        'expenses' => __('dashboard.notes.expenses'),
                        'cashPosition' => __('dashboard.notes.cash_position'),
                    ],
                ] : null,
                'attentionItems' => $attentionItems,
            ],
        ]);
    })->name('dashboard');

    // Users
    Route::middleware('role:super-admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::put('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
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
        Route::post('kitchen-categories', [KitchenController::class, 'storeKitchenCategory'])->name('kitchen-categories.store');
        Route::put('kitchen-categories/{kitchenCategory}', [KitchenController::class, 'updateKitchenCategory'])->name('kitchen-categories.update');
        Route::delete('kitchen-categories/{kitchenCategory}', [KitchenController::class, 'destroyKitchenCategory'])->name('kitchen-categories.destroy');
        Route::post('branches/{branch}/disable', [BranchController::class, 'disable'])->name('branches.disable');
    });

    // Products & Orders
    Route::middleware('can:'.PermissionEnum::PRODUCTS_VIEW->value)->group(function () {
        Route::get('products', [ProductController::class, 'index'])->name('products.index');
    });
    Route::middleware('can:'.PermissionEnum::PRODUCTS_CREATE->value)->group(function () {
        Route::post('products', [ProductController::class, 'store'])->name('products.store');
        Route::post('products/categories', [ProductController::class, 'storeCategory'])->name('products.categories.store');
        Route::post('products/types', [ProductController::class, 'storeType'])->name('products.types.store');
    });
    Route::middleware('can:'.PermissionEnum::PRODUCTS_UPDATE->value)->group(function () {
        Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::put('products/categories/{category}', [ProductController::class, 'updateCategory'])->name('products.categories.update');
        Route::put('products/types/{type}', [ProductController::class, 'updateType'])->name('products.types.update');
    });
    Route::middleware('can:'.PermissionEnum::PRODUCTS_DELETE->value)->group(function () {
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
        Route::delete('products/categories/{category}', [ProductController::class, 'destroyCategory'])->name('products.categories.destroy');
        Route::delete('products/types/{type}', [ProductController::class, 'destroyType'])->name('products.types.destroy');
        Route::delete('products/{product}/images/{productImage}', [ProductController::class, 'destroyImage'])->name('products.images.destroy');
    });
    Route::middleware('can:'.PermissionEnum::ORDERS_VIEW->value)->group(function () {
        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    });
    Route::middleware('can:'.PermissionEnum::ORDERS_CREATE->value)->group(function () {
        Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    });
    Route::middleware('can:'.PermissionEnum::ORDERS_UPDATE->value)->group(function () {
        Route::put('orders/{order}', [OrderController::class, 'update'])->name('orders.update');
        Route::patch('orders/{order}', [OrderController::class, 'update']);
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
        Route::patch('orders/{order}/table', [OrderController::class, 'updateTable'])->name('orders.table.update');
        Route::post('orders/{order}/items', [OrderController::class, 'addItems'])->name('orders.items.store');
    });
    Route::middleware('can:'.PermissionEnum::REPORTS_VIEW->value)->group(function () {
        Route::get('reports', [ReportsController::class, 'index'])->name('reports.index');
    });
    Route::middleware('can:'.PermissionEnum::REPORTS_EXPORT->value)->group(function () {
        Route::get('reports/export/pdf', [ReportsController::class, 'exportPdf'])->name('reports.export.pdf');
        Route::get('reports/export/xlsx', [ReportsController::class, 'exportXlsx'])->name('reports.export.xlsx');
    });

    // Inventory
    Route::middleware('can:'.PermissionEnum::INVENTORY_VIEW->value)->group(function () {
        Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    });
    Route::middleware('can:'.PermissionEnum::INVENTORY_ADJUST->value)->group(function () {
        Route::post('inventory', [InventoryController::class, 'store'])->name('inventory.store');
        Route::put('inventory/{inventory}', [InventoryController::class, 'update'])->name('inventory.update');
        Route::delete('inventory/{inventory}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
        Route::post('inventory/{inventory}/restock', [InventoryController::class, 'restock'])->name('inventory.restock');
        Route::post('inventory/usage-cycle', [InventoryController::class, 'storeUsageCycle'])->name('inventory.usage-cycle.store');
        Route::post('vendors', [InventoryController::class, 'storeVendor'])->name('vendors.store');
        Route::put('vendors/{vendor}', [InventoryController::class, 'updateVendor'])->name('vendors.update');
        Route::delete('vendors/{vendor}', [InventoryController::class, 'destroyVendor'])->name('vendors.destroy');
        Route::post('banners', [BannerController::class, 'store'])->name('banners.store');
        Route::put('banners/{banner}', [BannerController::class, 'update'])->name('banners.update');
        Route::delete('banners/{banner}', [BannerController::class, 'destroy'])->name('banners.destroy');
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
    });
    Route::middleware('can:'.PermissionEnum::FINANCE_VIEW->value)->group(function () {
        Route::get('finance', [FinanceController::class, 'index'])->name('finance.index');
        Route::get('finance/general-ledger', [FinanceController::class, 'generalLedger'])->name('finance.general-ledger.index');
        Route::get('finance/inventory-valuation', [FinanceController::class, 'inventoryValuation'])->name('finance.inventory-valuation.index');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_VIEW->value)->group(function () {
        Route::get('finance/payroll', [PayrollController::class, 'index'])->name('finance.payroll.index');
        Route::get('finance/employee-advances', [EmployeeAdvanceController::class, 'index'])->name('finance.employee-advances.index');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_CREATE->value)->group(function () {
        Route::post('finance/payroll', [PayrollController::class, 'store'])->name('finance.payroll.store');
        Route::post('finance/payroll/contracts', [PayrollController::class, 'storeContract'])->name('finance.payroll.contracts.store');
        Route::put('finance/payroll/contracts/{contract}', [PayrollController::class, 'updateContract'])->name('finance.payroll.contracts.update');
        Route::delete('finance/payroll/contracts/{contract}', [PayrollController::class, 'destroyContract'])->name('finance.payroll.contracts.destroy');
        Route::post('finance/payroll/contract-schedules', [PayrollController::class, 'storeSchedule'])->name('finance.payroll.contract-schedules.store');
        Route::put('finance/payroll/contract-schedules/{schedule}', [PayrollController::class, 'updateSchedule'])->name('finance.payroll.contract-schedules.update');
        Route::delete('finance/payroll/contract-schedules/{schedule}', [PayrollController::class, 'destroySchedule'])->name('finance.payroll.contract-schedules.destroy');
        Route::post('finance/employee-advances', [EmployeeAdvanceController::class, 'store'])->name('finance.employee-advances.store');
        Route::put('finance/employee-advances/{employeeAdvance}', [EmployeeAdvanceController::class, 'update'])->name('finance.employee-advances.update');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_APPROVE->value)->group(function () {
        Route::post('finance/payroll/contract-schedules/{schedule}/approve', [PayrollController::class, 'approveSchedule'])->name('finance.payroll.contract-schedules.approve');
        Route::post('finance/payroll/contract-schedules/{schedule}/reject', [PayrollController::class, 'rejectSchedule'])->name('finance.payroll.contract-schedules.reject');
        Route::post('finance/payroll/{payrollRun}/approve', [PayrollController::class, 'approve'])->name('finance.payroll.approve');
        Route::post('finance/payroll/{payrollRun}/reject', [PayrollController::class, 'reject'])->name('finance.payroll.reject');
        Route::post('finance/employee-advances/{employeeAdvance}/approve', [EmployeeAdvanceController::class, 'approve'])->name('finance.employee-advances.approve');
        Route::post('finance/employee-advances/{employeeAdvance}/reject', [EmployeeAdvanceController::class, 'reject'])->name('finance.employee-advances.reject');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_PAY->value)->group(function () {
        Route::post('finance/payroll/{payrollRun}/mark-paid', [PayrollController::class, 'markPaid'])->name('finance.payroll.mark-paid');
    });
    Route::middleware('can:'.PermissionEnum::EXPENSES_VIEW->value)->group(function () {
        Route::get('finance/expenses', [ExpenseController::class, 'index'])->name('finance.expenses.index');
    });
    Route::middleware('can:'.PermissionEnum::EXPENSES_CREATE->value)->group(function () {
        Route::post('finance/expenses', [ExpenseController::class, 'store'])->name('finance.expenses.store');
        Route::put('finance/expenses/{expense}', [ExpenseController::class, 'update'])->name('finance.expenses.update');
        Route::post('finance/expenses/{expense}/approve', [ExpenseController::class, 'approve'])->name('finance.expenses.approve');
        Route::post('finance/expenses/{expense}/reject', [ExpenseController::class, 'reject'])->name('finance.expenses.reject');
    });
    Route::middleware('can:'.PermissionEnum::FINANCE_MANAGE->value)->group(function () {
        Route::get('finance/chart-of-accounts', [ChartOfAccountController::class, 'index'])->name('finance.chart-of-accounts.index');
        Route::post('finance/chart-of-accounts', [ChartOfAccountController::class, 'store'])->name('finance.chart-of-accounts.store');
        Route::put('finance/chart-of-accounts/{financeAccount}', [ChartOfAccountController::class, 'update'])->name('finance.chart-of-accounts.update');
        Route::delete('finance/chart-of-accounts/{financeAccount}', [ChartOfAccountController::class, 'destroy'])->name('finance.chart-of-accounts.destroy');
        Route::get('finance/cash-bank', [CashBankController::class, 'index'])->name('finance.cash-bank.index');
        Route::post('finance/cash-bank', [CashBankController::class, 'store'])->name('finance.cash-bank.store');
        Route::put('finance/cash-bank/{cashMovement}', [CashBankController::class, 'update'])->name('finance.cash-bank.update');
        Route::post('finance/cash-bank/{cashMovement}/approve', [CashBankController::class, 'approve'])->name('finance.cash-bank.approve');
        Route::post('finance/cash-bank/{cashMovement}/reject', [CashBankController::class, 'reject'])->name('finance.cash-bank.reject');
        Route::get('finance/cash-movement-types', [CashMovementTypeController::class, 'index'])->name('finance.cash-movement-types.index');
        Route::post('finance/cash-movement-types', [CashMovementTypeController::class, 'store'])->name('finance.cash-movement-types.store');
        Route::put('finance/cash-movement-types/{cashMovementType}', [CashMovementTypeController::class, 'update'])->name('finance.cash-movement-types.update');
        Route::delete('finance/cash-movement-types/{cashMovementType}', [CashMovementTypeController::class, 'destroy'])->name('finance.cash-movement-types.destroy');
        Route::get('finance/expense-categories', [ExpenseCategoryController::class, 'index'])->name('finance.expense-categories.index');
        Route::post('finance/expense-categories', [ExpenseCategoryController::class, 'store'])->name('finance.expense-categories.store');
        Route::put('finance/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'update'])->name('finance.expense-categories.update');
        Route::delete('finance/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'destroy'])->name('finance.expense-categories.destroy');
    });

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
