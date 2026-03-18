<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashMovement;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportsController extends Controller
{
    private const MODULES = [
        'orders',
        'inventory',
        'products',
        'employees',
        'finance',
        'branches',
        'users',
    ];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,this_week,this_month,last_30_days,custom'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'module' => ['nullable', 'in:'.implode(',', self::MODULES)],
        ]);

        $range = $validated['range'] ?? 'this_month';
        [$startDate, $endDate] = $this->resolvePeriod(
            $range,
            $validated['start_date'] ?? null,
            $validated['end_date'] ?? null,
        );

        $selectedModule = $validated['module'] ?? 'orders';
        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;

        return Inertia::render('reports/index', [
            'branches' => Branch::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => [
                'range' => $range,
                'startDate' => $startDate->toDateString(),
                'endDate' => $endDate->toDateString(),
                'branchId' => $branchId,
                'module' => $selectedModule,
            ],
            'reportCatalog' => $this->reportCatalog(),
            'overview' => $this->buildOverview($startDate, $endDate, $branchId),
            'activeReport' => $this->buildActiveReport(
                $selectedModule,
                $startDate,
                $endDate,
                $branchId,
            ),
            'period' => [
                'label' => sprintf(
                    '%s to %s',
                    $startDate->format('M d, Y'),
                    $endDate->format('M d, Y'),
                ),
                'startDate' => $startDate->toDateString(),
                'endDate' => $endDate->toDateString(),
            ],
        ]);
    }

    private function resolvePeriod(
        string $range,
        ?string $startDate,
        ?string $endDate,
    ): array {
        $today = Carbon::today();

        return match ($range) {
            'today' => [$today->copy()->startOfDay(), $today->copy()->endOfDay()],
            'yesterday' => [
                $today->copy()->subDay()->startOfDay(),
                $today->copy()->subDay()->endOfDay(),
            ],
            'this_week' => [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()],
            'last_30_days' => [$today->copy()->subDays(29)->startOfDay(), $today->copy()->endOfDay()],
            'custom' => $this->resolveCustomPeriod($startDate, $endDate),
            default => [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()],
        };
    }

    private function resolveCustomPeriod(?string $startDate, ?string $endDate): array
    {
        $start = $startDate
            ? Carbon::parse($startDate)->startOfDay()
            : Carbon::today()->startOfMonth();
        $end = $endDate
            ? Carbon::parse($endDate)->endOfDay()
            : Carbon::today()->endOfDay();

        if ($start->greaterThan($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start, $end];
    }

    private function reportCatalog(): array
    {
        return [
            [
                'key' => 'orders',
                'title' => 'Orders',
                'description' => 'Sales volume, order mix, branch performance, and cashier-ready summaries.',
                'status' => 'live',
            ],
            [
                'key' => 'inventory',
                'title' => 'Inventory',
                'description' => 'Stock valuation, movement history, low-stock analysis, and vendor exposure.',
                'status' => 'live',
            ],
            [
                'key' => 'products',
                'title' => 'Products',
                'description' => 'Catalog growth, pricing, top sellers, and kitchen/category coverage.',
                'status' => 'live',
            ],
            [
                'key' => 'employees',
                'title' => 'Employees',
                'description' => 'Headcount, payroll-facing trends, contract activity, and branch staffing.',
                'status' => 'planned',
            ],
            [
                'key' => 'finance',
                'title' => 'Finance',
                'description' => 'Revenue, expenses, cash position, and operational profitability windows.',
                'status' => 'live',
            ],
            [
                'key' => 'branches',
                'title' => 'Branches',
                'description' => 'Branch activity, operational footprint, and regional comparisons.',
                'status' => 'planned',
            ],
            [
                'key' => 'users',
                'title' => 'Users',
                'description' => 'Access activity, onboarding, and branch-level user distribution.',
                'status' => 'planned',
            ],
        ];
    }

    private function buildOverview(Carbon $startDate, Carbon $endDate, ?int $branchId): array
    {
        $ordersQuery = Order::query()->whereBetween('created_at', [$startDate, $endDate]);
        $expensesQuery = Expense::query()->whereBetween('expense_date', [
            $startDate->toDateString(),
            $endDate->toDateString(),
        ]);
        $inventoryQuery = InventoryItem::query();
        $employeesQuery = Employee::query();
        $usersQuery = User::query();

        $this->applyBranchScope($ordersQuery, $branchId);
        $this->applyBranchScope($expensesQuery, $branchId);
        $this->applyBranchScope($inventoryQuery, $branchId);
        $this->applyBranchScope($employeesQuery, $branchId);
        $this->applyBranchScope($usersQuery, $branchId);

        $inventoryValue = (clone $inventoryQuery)->get(['quantity', 'unit_price'])
            ->sum(fn (InventoryItem $item) => (float) $item->quantity * (float) ($item->unit_price ?? 0));

        $completedRevenue = (float) (clone $ordersQuery)
            ->where('status', 'completed')
            ->sum('total_amount');

        $expensesTotal = (float) (clone $expensesQuery)->sum('amount');

        return [
            [
                'key' => 'orders',
                'title' => 'Orders',
                'primary' => (int) (clone $ordersQuery)->count(),
                'primaryLabel' => 'Orders in period',
                'secondary' => $completedRevenue,
                'secondaryLabel' => 'Completed revenue',
                'secondaryFormat' => 'currency',
            ],
            [
                'key' => 'inventory',
                'title' => 'Inventory',
                'primary' => (int) (clone $inventoryQuery)->count(),
                'primaryLabel' => 'Tracked items',
                'secondary' => (float) $inventoryValue,
                'secondaryLabel' => 'Current stock value',
                'secondaryFormat' => 'currency',
            ],
            [
                'key' => 'products',
                'title' => 'Products',
                'primary' => (int) Product::query()->count(),
                'primaryLabel' => 'Catalog items',
                'secondary' => (int) Product::query()->where('is_active', true)->count(),
                'secondaryLabel' => 'Active products',
                'secondaryFormat' => 'number',
            ],
            [
                'key' => 'employees',
                'title' => 'Employees',
                'primary' => (int) (clone $employeesQuery)->count(),
                'primaryLabel' => 'Employees in scope',
                'secondary' => (int) (clone $employeesQuery)->where('is_active', true)->count(),
                'secondaryLabel' => 'Active team members',
                'secondaryFormat' => 'number',
            ],
            [
                'key' => 'finance',
                'title' => 'Finance',
                'primary' => $completedRevenue,
                'primaryLabel' => 'Recognized revenue',
                'secondary' => $expensesTotal,
                'secondaryLabel' => 'Operating expenses',
                'secondaryFormat' => 'currency',
                'primaryFormat' => 'currency',
            ],
            [
                'key' => 'branches',
                'title' => 'Branches',
                'primary' => (int) Branch::query()->count(),
                'primaryLabel' => 'Total branches',
                'secondary' => (int) Branch::query()->where('is_active', true)->count(),
                'secondaryLabel' => 'Active branches',
                'secondaryFormat' => 'number',
            ],
            [
                'key' => 'users',
                'title' => 'Users',
                'primary' => (int) (clone $usersQuery)->count(),
                'primaryLabel' => 'Users in scope',
                'secondary' => (int) (clone $usersQuery)->where('is_active', true)->count(),
                'secondaryLabel' => 'Active users',
                'secondaryFormat' => 'number',
            ],
        ];
    }

    private function buildActiveReport(
        string $module,
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        return match ($module) {
            'orders' => $this->buildOrdersReport($startDate, $endDate, $branchId),
            'inventory' => $this->buildInventoryReport($startDate, $endDate, $branchId),
            'finance' => $this->buildFinanceReport($startDate, $endDate, $branchId),
            'products' => $this->buildProductsReport($startDate, $endDate, $branchId),
            default => $this->buildPlannedReport($module),
        };
    }

    private function buildPlannedReport(string $module): array
    {
        $catalog = collect($this->reportCatalog())->firstWhere('key', $module);

        return [
            'key' => $module,
            'title' => $catalog['title'] ?? ucfirst($module),
            'description' => $catalog['description'] ?? 'This report is being prepared for rollout.',
            'isReady' => false,
            'status' => $catalog['status'] ?? 'planned',
                'highlights' => [
                    'This report family is designed, but not implemented yet.',
                    'It will reuse the same date range, branch scope, print, PDF, and Excel workflow.',
                    'Recommended next rollout order: Employees, Branches, Users.',
                ],
            ];
    }

    private function buildOrdersReport(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        $ordersQuery = Order::query()
            ->with(['branch:id,name', 'user:id,name'])
            ->withCount('items')
            ->whereBetween('created_at', [$startDate, $endDate]);

        $this->applyBranchScope($ordersQuery, $branchId);

        $orders = $ordersQuery
            ->orderByDesc('created_at')
            ->get();

        $statusBuckets = [
            'pending' => 0,
            'in_progress' => 0,
            'ready' => 0,
            'completed' => 0,
            'cancelled' => 0,
        ];

        foreach ($orders as $order) {
            $status = (string) ($order->status?->value ?? $order->status ?? 'pending');
            if (array_key_exists($status, $statusBuckets)) {
                $statusBuckets[$status] += 1;
            }
        }

        $completedOrders = $orders->filter(
            fn (Order $order) => (string) ($order->status?->value ?? $order->status) === 'completed'
        );

        $branchBreakdown = $orders
            ->groupBy(fn (Order $order) => $order->branch?->name ?? 'Unassigned')
            ->map(fn ($group, $name) => [
                'branch' => $name,
                'orders' => $group->count(),
                'revenue' => (float) $group
                    ->filter(fn (Order $order) => (string) ($order->status?->value ?? $order->status) === 'completed')
                    ->sum('total_amount'),
            ])
            ->sortByDesc('revenue')
            ->values()
            ->all();

        $topProductsQuery = OrderItem::query()
            ->selectRaw('COALESCE(products.name, order_items.product_name_snapshot, \'Unknown\') as product_name')
            ->selectRaw('SUM(order_items.quantity) as total_quantity')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.status', '!=', 'cancelled');

        if ($branchId !== null) {
            $topProductsQuery->where('orders.branch_id', $branchId);
        }

        $topProducts = $topProductsQuery
            ->groupBy('products.name', 'order_items.product_name_snapshot')
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->product_name,
                'quantity' => (int) $row->total_quantity,
            ])
            ->values()
            ->all();

        return [
            'key' => 'orders',
            'title' => 'Orders Report',
            'description' => 'Live operational report for sales, fulfillment status, and branch performance.',
            'isReady' => true,
            'status' => 'live',
            'currencyColumns' => ['total', 'paid'],
            'columns' => [
                ['key' => 'reference', 'label' => 'Order'],
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'items', 'label' => 'Items'],
                ['key' => 'total', 'label' => 'Total'],
                ['key' => 'paid', 'label' => 'Paid'],
                ['key' => 'servedBy', 'label' => 'User'],
            ],
            'rows' => $orders->map(fn (Order $order) => [
                'reference' => '#'.$order->id,
                'date' => optional($order->created_at)->format('Y-m-d H:i') ?? '-',
                'branch' => $order->branch?->name ?? 'Unassigned',
                'customer' => $order->customer_name ?: 'Walk-in',
                'type' => ucfirst((string) ($order->order_type?->value ?? $order->order_type ?? '-')),
                'status' => str_replace('_', ' ', ucfirst((string) ($order->status?->value ?? $order->status ?? 'pending'))),
                'items' => (int) ($order->items_count ?? 0),
                'total' => (float) $order->total_amount,
                'paid' => (float) $order->paid_amount,
                'servedBy' => $order->user?->name ?? '-',
            ])->values()->all(),
            'summary' => [
                [
                    'label' => 'Orders',
                    'value' => (int) $orders->count(),
                    'format' => 'number',
                ],
                [
                    'label' => 'Completed Revenue',
                    'value' => (float) $completedOrders->sum('total_amount'),
                    'format' => 'currency',
                ],
                [
                    'label' => 'Average Order Value',
                    'value' => $completedOrders->count() > 0
                        ? (float) $completedOrders->avg('total_amount')
                        : 0,
                    'format' => 'currency',
                ],
                [
                    'label' => 'Cancelled Orders',
                    'value' => (int) ($statusBuckets['cancelled'] ?? 0),
                    'format' => 'number',
                ],
            ],
            'insights' => [
                [
                    'title' => 'Status breakdown',
                    'description' => 'Quick distribution for the selected report window.',
                    'items' => collect($statusBuckets)->map(
                        fn ($count, $status) => [
                            'label' => str_replace('_', ' ', ucfirst($status)),
                            'value' => (string) $count,
                        ]
                    )->values()->all(),
                ],
                [
                    'title' => 'Branch performance',
                    'description' => 'Highest-performing branches inside the selected window.',
                    'items' => collect($branchBreakdown)->take(5)->map(
                        fn ($row) => [
                            'label' => $row['branch'],
                            'value' => number_format((float) $row['orders'], 0).' orders',
                            'meta' => 'Revenue '.number_format((float) $row['revenue'], 0),
                        ]
                    )->values()->all(),
                ],
                [
                    'title' => 'Top products',
                    'description' => 'Best-selling items in the selected period.',
                    'items' => collect($topProducts)->map(
                        fn ($row) => [
                            'label' => $row['name'],
                            'value' => number_format((float) $row['quantity'], 0).' qty',
                        ]
                    )->values()->all(),
                ],
            ],
            'exportNotes' => [
                'Use Print for paper output or Save as PDF from the browser print dialog.',
                'Excel export is delivered as CSV so managers can open it directly in Excel.',
            ],
        ];
    }

    private function buildInventoryReport(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        $transactionsQuery = InventoryTransaction::query()
            ->with([
                'inventoryItem.branch:id,name',
                'inventoryItem.vendor:id,name',
                'inventoryItem.categoryReference:id,name',
                'inventoryItem.typeReference:id,name',
            ])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($branchId !== null) {
            $transactionsQuery->whereHas(
                'inventoryItem',
                fn (Builder $query) => $query->where('branch_id', $branchId),
            );
        }

        $transactions = $transactionsQuery
            ->orderByDesc('created_at')
            ->get();

        $inventoryItemsQuery = InventoryItem::query()->with(['branch:id,name']);
        $this->applyBranchScope($inventoryItemsQuery, $branchId);
        $inventoryItems = $inventoryItemsQuery->get();

        $stockValue = (float) $inventoryItems->sum(
            fn (InventoryItem $item) => (float) $item->quantity * (float) ($item->unit_price ?? 0),
        );
        $lowStockCount = (int) $inventoryItems
            ->filter(fn (InventoryItem $item) => (float) $item->quantity > 0 && (float) $item->quantity <= 10)
            ->count();
        $outOfStockCount = (int) $inventoryItems
            ->filter(fn (InventoryItem $item) => (float) $item->quantity <= 0)
            ->count();
        $incomingQuantity = (float) $transactions
            ->filter(fn (InventoryTransaction $transaction) => (float) $transaction->quantity > 0)
            ->sum('quantity');
        $outgoingQuantity = abs((float) $transactions
            ->filter(fn (InventoryTransaction $transaction) => (float) $transaction->quantity < 0)
            ->sum('quantity'));

        $actionBreakdown = $transactions
            ->groupBy('action')
            ->map(fn ($group, $action) => [
                'label' => str($action)->replace('_', ' ')->title()->toString(),
                'value' => number_format((float) $group->count(), 0).' moves',
                'meta' => number_format(abs((float) $group->sum('quantity')), 0).' qty',
            ])
            ->values()
            ->all();

        $branchMovement = $transactions
            ->groupBy(fn (InventoryTransaction $transaction) => $transaction->inventoryItem?->branch?->name ?? 'Unassigned')
            ->map(fn ($group, $branch) => [
                'label' => $branch,
                'value' => number_format((float) $group->count(), 0).' moves',
                'meta' => number_format(abs((float) $group->sum('quantity')), 0).' qty',
            ])
            ->take(5)
            ->values()
            ->all();

        $topMovedItems = $transactions
            ->groupBy(fn (InventoryTransaction $transaction) => $transaction->inventoryItem?->name ?? 'Unknown')
            ->map(fn ($group, $item) => [
                'label' => $item,
                'value' => number_format(abs((float) $group->sum('quantity')), 0).' qty',
                'meta' => number_format((float) $group->count(), 0).' records',
            ])
            ->sortByDesc(fn ($row) => (float) str_replace(',', '', explode(' ', $row['value'])[0]))
            ->take(5)
            ->values()
            ->all();

        return [
            'key' => 'inventory',
            'title' => 'Inventory Report',
            'description' => 'Movement-driven report for stock activity, branch exposure, and current inventory value.',
            'isReady' => true,
            'status' => 'live',
            'currencyColumns' => ['unitCost', 'totalCost'],
            'columns' => [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'action', 'label' => 'Action'],
                ['key' => 'quantity', 'label' => 'Quantity'],
                ['key' => 'unitCost', 'label' => 'Unit Cost'],
                ['key' => 'totalCost', 'label' => 'Total Cost'],
                ['key' => 'vendor', 'label' => 'Vendor'],
                ['key' => 'note', 'label' => 'Note'],
            ],
            'rows' => $transactions->map(fn (InventoryTransaction $transaction) => [
                'date' => optional($transaction->created_at)->format('Y-m-d H:i') ?? '-',
                'item' => $transaction->inventoryItem?->name ?? 'Unknown',
                'branch' => $transaction->inventoryItem?->branch?->name ?? 'Unassigned',
                'category' => $transaction->inventoryItem?->categoryReference?->name ?? '-',
                'action' => str($transaction->action)->replace('_', ' ')->title()->toString(),
                'quantity' => number_format((float) $transaction->quantity, 2),
                'unitCost' => (float) ($transaction->unit_cost ?? $transaction->inventoryItem?->unit_price ?? 0),
                'totalCost' => (float) ($transaction->total_cost ?? ((float) $transaction->quantity * (float) ($transaction->unit_cost ?? $transaction->inventoryItem?->unit_price ?? 0))),
                'vendor' => $transaction->inventoryItem?->vendor?->name ?? '-',
                'note' => $transaction->note ?? '-',
            ])->values()->all(),
            'summary' => [
                ['label' => 'Movement Records', 'value' => (int) $transactions->count(), 'format' => 'number'],
                ['label' => 'Current Stock Value', 'value' => $stockValue, 'format' => 'currency'],
                ['label' => 'Incoming Quantity', 'value' => $incomingQuantity, 'format' => 'number'],
                ['label' => 'Outgoing Quantity', 'value' => $outgoingQuantity, 'format' => 'number'],
            ],
            'insights' => [
                [
                    'title' => 'Stock health',
                    'description' => 'Current stock posture in the selected branch scope.',
                    'items' => [
                        ['label' => 'Tracked items', 'value' => number_format((float) $inventoryItems->count(), 0)],
                        ['label' => 'Low stock items', 'value' => number_format((float) $lowStockCount, 0)],
                        ['label' => 'Out of stock', 'value' => number_format((float) $outOfStockCount, 0)],
                    ],
                ],
                [
                    'title' => 'Action mix',
                    'description' => 'Most common inventory activities during this period.',
                    'items' => $actionBreakdown,
                ],
                [
                    'title' => 'Branch movement',
                    'description' => 'Where inventory activity is happening most.',
                    'items' => $branchMovement,
                ],
                [
                    'title' => 'Top moved items',
                    'description' => 'Items with the highest absolute quantity movement.',
                    'items' => $topMovedItems,
                ],
            ],
            'exportNotes' => [
                'This report uses transaction history inside the selected date period.',
                'Current stock value remains a live snapshot so managers can compare movement with present inventory.',
            ],
        ];
    }

    private function buildFinanceReport(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        $sales = Order::query()
            ->with(['branch:id,name'])
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $expenses = Expense::query()
            ->with(['branch:id,name', 'expenseCategory:id,name'])
            ->whereBetween('expense_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $cashMovements = CashMovement::query()
            ->with(['branch:id,name', 'account:id,name'])
            ->where('approval_status', 'approved')
            ->whereBetween('movement_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $salesTotal = (float) $sales->sum('total_amount');
        $expensesTotal = (float) $expenses->sum('amount');
        $cashMovementNet = (float) $cashMovements->sum(
            fn (CashMovement $movement) => $movement->direction === 'in'
                ? (float) $movement->amount
                : -1 * (float) $movement->amount,
        );

        $rows = collect()
            ->merge($sales->map(fn (Order $order) => [
                'date' => optional($order->created_at)->format('Y-m-d'),
                'branch' => $order->branch?->name ?? 'Unassigned',
                'source' => 'Sale',
                'reference' => '#'.$order->id,
                'account' => 'Orders',
                'direction' => 'In',
                'amount' => (float) $order->total_amount,
                'status' => 'Completed',
            ]))
            ->merge($expenses->map(fn (Expense $expense) => [
                'date' => optional($expense->expense_date)->format('Y-m-d') ?? '-',
                'branch' => $expense->branch?->name ?? 'Unassigned',
                'source' => 'Expense',
                'reference' => $expense->title ?? '#'.$expense->id,
                'account' => $expense->expenseCategory?->name ?? ($expense->expense_type ?: '-'),
                'direction' => 'Out',
                'amount' => (float) $expense->amount,
                'status' => (string) ($expense->approval_status ?? 'Recorded'),
            ]))
            ->merge($cashMovements->map(fn (CashMovement $movement) => [
                'date' => optional($movement->movement_date)->format('Y-m-d') ?? '-',
                'branch' => $movement->branch?->name ?? 'Unassigned',
                'source' => 'Cash Movement',
                'reference' => str($movement->movement_type)->replace('_', ' ')->title()->toString(),
                'account' => $movement->account?->name ?? '-',
                'direction' => $movement->direction === 'in' ? 'In' : 'Out',
                'amount' => (float) $movement->amount,
                'status' => 'Approved',
            ]))
            ->sortByDesc('date')
            ->values();

        $branchFinancials = $sales
            ->groupBy(fn (Order $order) => $order->branch?->name ?? 'Unassigned')
            ->map(fn ($group, $branch) => [
                'sales' => (float) $group->sum('total_amount'),
                'branch' => $branch,
            ]);

        foreach ($expenses->groupBy(fn (Expense $expense) => $expense->branch?->name ?? 'Unassigned') as $branch => $group) {
            $existing = $branchFinancials[$branch] ?? ['sales' => 0.0, 'branch' => $branch];
            $existing['expenses'] = (float) $group->sum('amount');
            $branchFinancials[$branch] = $existing;
        }

        $branchFinancialItems = collect($branchFinancials)
            ->map(function ($row) {
                $expenses = (float) ($row['expenses'] ?? 0);

                return [
                    'label' => $row['branch'],
                    'value' => 'Sales '.number_format((float) $row['sales'], 0),
                    'meta' => 'Expenses '.number_format($expenses, 0),
                ];
            })
            ->take(5)
            ->values()
            ->all();

        $expenseCategories = $expenses
            ->groupBy(fn (Expense $expense) => $expense->expenseCategory?->name ?? ($expense->expense_type ?: 'Uncategorized'))
            ->map(fn ($group, $category) => [
                'label' => $category,
                'value' => number_format((float) $group->sum('amount'), 0),
            ])
            ->sortByDesc(fn ($row) => (float) str_replace(',', '', $row['value']))
            ->take(5)
            ->values()
            ->all();

        $cashDirections = [
            [
                'label' => 'Cash in',
                'value' => number_format((float) $cashMovements->where('direction', 'in')->sum('amount'), 0),
            ],
            [
                'label' => 'Cash out',
                'value' => number_format((float) $cashMovements->where('direction', 'out')->sum('amount'), 0),
            ],
            [
                'label' => 'Net cash movement',
                'value' => number_format($cashMovementNet, 0),
            ],
        ];

        return [
            'key' => 'finance',
            'title' => 'Finance Report',
            'description' => 'Unified financial view across sales, expenses, and approved cash movement activity.',
            'isReady' => true,
            'status' => 'live',
            'currencyColumns' => ['amount'],
            'columns' => [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'source', 'label' => 'Source'],
                ['key' => 'reference', 'label' => 'Reference'],
                ['key' => 'account', 'label' => 'Account'],
                ['key' => 'direction', 'label' => 'Direction'],
                ['key' => 'amount', 'label' => 'Amount'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows->all(),
            'summary' => [
                ['label' => 'Sales', 'value' => $salesTotal, 'format' => 'currency'],
                ['label' => 'Expenses', 'value' => $expensesTotal, 'format' => 'currency'],
                ['label' => 'Operating Net', 'value' => $salesTotal - $expensesTotal, 'format' => 'currency'],
                ['label' => 'Cash Net', 'value' => $cashMovementNet, 'format' => 'currency'],
            ],
            'insights' => [
                [
                    'title' => 'Branch financials',
                    'description' => 'Revenue and expense comparison by branch.',
                    'items' => $branchFinancialItems,
                ],
                [
                    'title' => 'Expense categories',
                    'description' => 'Largest expense buckets inside the selected period.',
                    'items' => $expenseCategories,
                ],
                [
                    'title' => 'Cash direction',
                    'description' => 'Approved cash movement direction during the same period.',
                    'items' => $cashDirections,
                ],
            ],
            'exportNotes' => [
                'Finance rows combine completed sales, recorded expenses, and approved cash movements.',
                'Operating Net compares sales and expenses, while Cash Net isolates approved cash movement direction.',
            ],
        ];
    }

    private function buildProductsReport(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        $products = Product::query()
            ->with(['category:id,name', 'kitchen:id,name'])
            ->orderBy('name')
            ->get();

        $salesByProduct = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.status', '!=', 'cancelled')
            ->when($branchId, fn (Builder $query) => $query->where('orders.branch_id', $branchId))
            ->selectRaw('order_items.product_id as product_id')
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as sold_quantity')
            ->selectRaw('COALESCE(SUM(order_items.line_total), 0) as sales_total')
            ->selectRaw('COUNT(DISTINCT orders.id) as orders_count')
            ->groupBy('order_items.product_id')
            ->get()
            ->keyBy('product_id');

        $rows = $products->map(function (Product $product) use ($salesByProduct) {
            $sales = $salesByProduct->get($product->id);

            return [
                'product' => $product->name,
                'category' => $product->category?->name ?? '-',
                'kitchen' => $product->kitchen?->name ?? '-',
                'status' => $product->is_active ? 'Active' : 'Inactive',
                'basePrice' => (float) ($product->base_price ?? 0),
                'soldQty' => (int) ($sales->sold_quantity ?? 0),
                'salesTotal' => (float) ($sales->sales_total ?? 0),
                'orders' => (int) ($sales->orders_count ?? 0),
                'type' => str($product->type)->replace('_', ' ')->title()->toString(),
            ];
        })->sortByDesc('soldQty')->values();

        $categoryPerformance = $rows
            ->groupBy('category')
            ->map(fn ($group, $category) => [
                'label' => $category,
                'value' => number_format((float) $group->sum('soldQty'), 0).' qty',
                'meta' => 'Sales '.number_format((float) $group->sum('salesTotal'), 0),
            ])
            ->take(5)
            ->values()
            ->all();

        $kitchenCoverage = $rows
            ->groupBy('kitchen')
            ->map(fn ($group, $kitchen) => [
                'label' => $kitchen,
                'value' => number_format((float) $group->count(), 0).' products',
                'meta' => number_format((float) $group->sum('soldQty'), 0).' qty sold',
            ])
            ->take(5)
            ->values()
            ->all();

        $topSellers = $rows
            ->take(5)
            ->map(fn ($row) => [
                'label' => $row['product'],
                'value' => number_format((float) $row['soldQty'], 0).' qty',
                'meta' => 'Sales '.number_format((float) $row['salesTotal'], 0),
            ])
            ->values()
            ->all();

        return [
            'key' => 'products',
            'title' => 'Products Report',
            'description' => 'Catalog and sales-performance report for products, categories, and kitchen alignment.',
            'isReady' => true,
            'status' => 'live',
            'currencyColumns' => ['basePrice', 'salesTotal'],
            'columns' => [
                ['key' => 'product', 'label' => 'Product'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'kitchen', 'label' => 'Kitchen'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'basePrice', 'label' => 'Base Price'],
                ['key' => 'soldQty', 'label' => 'Sold Qty'],
                ['key' => 'salesTotal', 'label' => 'Sales Total'],
                ['key' => 'orders', 'label' => 'Orders'],
            ],
            'rows' => $rows->all(),
            'summary' => [
                ['label' => 'Catalog Products', 'value' => (int) $products->count(), 'format' => 'number'],
                ['label' => 'Active Products', 'value' => (int) $products->where('is_active', true)->count(), 'format' => 'number'],
                ['label' => 'Sold Quantity', 'value' => (float) $rows->sum('soldQty'), 'format' => 'number'],
                ['label' => 'Sales Total', 'value' => (float) $rows->sum('salesTotal'), 'format' => 'currency'],
            ],
            'insights' => [
                [
                    'title' => 'Top sellers',
                    'description' => 'Products with the strongest sales in the selected period.',
                    'items' => $topSellers,
                ],
                [
                    'title' => 'Category performance',
                    'description' => 'Sales concentration by product category.',
                    'items' => $categoryPerformance,
                ],
                [
                    'title' => 'Kitchen coverage',
                    'description' => 'How the catalog is distributed across kitchens.',
                    'items' => $kitchenCoverage,
                ],
            ],
            'exportNotes' => [
                'Sales metrics are scoped to the selected date period and optional branch.',
                'Catalog counts remain based on the current product list so managers can compare live assortment against period sales.',
            ],
        ];
    }

    private function applyBranchScope(Builder $query, ?int $branchId): void
    {
        if ($branchId !== null) {
            $query->where('branch_id', $branchId);
        }
    }
}
