<?php

namespace App\Services\Dashboard;

use App\Enums\PermissionEnum;
use App\Models\BranchDailyMetric;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\User;
use App\Services\Product\TopOrderedDishService;
use App\Services\Projection\ProjectionHealthService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardService
{
    public function __construct(
        private readonly ProjectionHealthService $projectionHealthService,
        private readonly TopOrderedDishService $topOrderedDishService,
    ) {}

    public function build(User $user, ?string $date = null): array
    {
        $canViewOrders = $user->can(PermissionEnum::ORDERS_VIEW->value);
        $canViewInventory = $user->can(PermissionEnum::INVENTORY_VIEW->value);
        $canViewFinance = $user->can(PermissionEnum::FINANCE_VIEW->value);

        $selectedDate = Carbon::parse($date ?? Carbon::today()->toDateString());
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
            ->limit(10)
            ->get();

        $topOrderedDishes = $this->topOrderedDishService->get(6);

        $analyticsByDate = [];

        for ($i = 6; $i >= 0; $i--) {
            $day = $analyticsReferenceDate->copy()->subDays($i);
            $dateKey = $day->toDateString();

            $analyticsByDate[$dateKey] = [
                'date' => $dateKey,
                'day' => $day->format('D'),
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

        $inventorySummary = $this->buildInventorySummary();
        $financeSummary = $this->buildFinanceSummary($orderStats);

        return [
            'orders' => $canViewOrders ? $orderStats : null,
            'orderAnalytics' => $canViewOrders ? array_values($analyticsByDate) : [],
            'recentOrders' => $canViewOrders ? $recentOrders : [],
            'topOrderedDishes' => $canViewOrders ? $topOrderedDishes : [],
            'selectedDate' => $selectedDateString,
            'inventory' => $canViewInventory ? [
                'totalItems' => $inventorySummary['totalItems'],
                'totalFixedItems' => $inventorySummary['totalFixedItems'],
                'totalUsableItems' => $inventorySummary['totalUsableItems'],
                'lowStockItems' => $inventorySummary['lowStockItems'],
                'outOfStockItems' => $inventorySummary['outOfStockItems'],
                'inventoryValue' => round($inventorySummary['inventoryValue'], 2),
                'amountOwedToVendors' => round($inventorySummary['amountOwedToVendors'], 2),
                'pie' => $inventorySummary['inventoryPie'],
                'lowStockQuickList' => $inventorySummary['lowStockQuickList'],
            ] : null,
            'finance' => $canViewFinance ? [
                'netProfit' => (float) $financeSummary['dashboardNetProfit'],
                'expenses' => (float) $financeSummary['dashboardExpensesTotal'],
                'cashPosition' => (float) $financeSummary['dashboardCashPosition'],
                'projectionHealth' => $financeSummary['projectionHealth'],
                'monthlyNetProfit' => $financeSummary['monthlyNetProfit'],
                'branchPerformance' => $financeSummary['branchPerformance'],
                'notes' => [
                    'netProfit' => $financeSummary['dashboardGrossProfit'] === null
                        ? __('dashboard.notes.net_profit_without_cogs')
                        : __('dashboard.notes.net_profit_with_cogs'),
                    'expenses' => __('dashboard.notes.expenses'),
                    'cashPosition' => __('dashboard.notes.cash_position'),
                ],
            ] : null,
            'attentionItems' => $financeSummary['attentionItems'],
        ];
    }

    private function buildInventorySummary(): array
    {
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

        return [
            'totalItems' => $totalInventoryItems,
            'totalFixedItems' => $totalFixedItems,
            'totalUsableItems' => $totalUsableItems,
            'lowStockItems' => $lowStockItems,
            'outOfStockItems' => $outOfStockItems,
            'inventoryValue' => $inventoryValue,
            'amountOwedToVendors' => $amountOwedToVendors,
            'inventoryPie' => $inventoryPie,
            'lowStockQuickList' => $lowStockQuickList,
        ];
    }

    private function buildFinanceSummary(array $orderStats): array
    {
        // The dashboard should feel immediate. Use live totals here so
        // recently completed sales appear even when projections are stale.
        $dashboardSalesTotal = (float) Order::query()
            ->where('status', 'completed')
            ->where(fn ($query) => $query->whereNull('covered_by_type')->orWhere('covered_by_type', '!=', 'house'))
            ->sum('total_amount');

        $dashboardExpensesTotal = (float) Expense::query()
            ->where('approval_status', 'approved')
            ->sum('amount');

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
                ->where('approval_status', 'approved')
                ->sum('amount')
            : 0.0;

        $dashboardCashMovementsNet = Schema::hasTable('cash_movements')
            ? (float) DB::table('cash_movements')
                ->where('approval_status', 'approved')
                ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total")
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
        $projectionHealth = $this->projectionHealthService->snapshot(true);

        $monthlyStartDate = Carbon::today()->copy()->subMonths(4)->startOfMonth();
        $monthlyEndDate = Carbon::today()->copy()->endOfMonth();

        $monthlySales = Order::query()
            ->where('status', 'completed')
            ->where(fn ($query) => $query->whereNull('covered_by_type')->orWhere('covered_by_type', '!=', 'house'))
            ->whereBetween('created_at', [$monthlyStartDate, $monthlyEndDate])
            ->get(['created_at', 'total_amount'])
            ->groupBy(fn ($order) => Carbon::parse($order->created_at)->format('Y-m'))
            ->map(fn ($orders) => (float) $orders->sum('total_amount'));

        $monthlyExpenses = Expense::query()
            ->where('approval_status', 'approved')
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
            $grossProfit = $cogs === null ? $sales : $sales - $cogs;

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

        $inventorySummary = $this->buildInventorySummary();
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
            $inventorySummary['outOfStockItems'] > 0
                ? [
                    'title' => __('dashboard.attention.out_of_stock_title'),
                    'detail' => __('dashboard.attention.out_of_stock_detail', [
                        'count' => $inventorySummary['outOfStockItems'],
                    ]),
                    'level' => 'critical',
                ]
                : null,
            $inventorySummary['lowStockItems'] > 0
                ? [
                    'title' => __('dashboard.attention.low_stock_title'),
                    'detail' => __('dashboard.attention.low_stock_detail', [
                        'count' => $inventorySummary['lowStockItems'],
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
            $inventorySummary['amountOwedToVendors'] > 0
                ? [
                    'title' => __('dashboard.attention.vendor_balances_title'),
                    'detail' => __('dashboard.attention.vendor_balances_detail', [
                        'amount' => number_format($inventorySummary['amountOwedToVendors'], 0),
                    ]),
                    'level' => 'info',
                ]
                : null,
        ])->filter()->take(4)->values()->all();

        return [
            'dashboardExpensesTotal' => $dashboardExpensesTotal,
            'dashboardGrossProfit' => $dashboardGrossProfit,
            'dashboardNetProfit' => $dashboardNetProfit,
            'dashboardCashPosition' => $dashboardCashPosition,
            'projectionHealth' => $projectionHealth,
            'monthlyNetProfit' => $monthlyNetProfit,
            'branchPerformance' => $branchPerformance,
            'attentionItems' => $attentionItems,
        ];
    }
}
