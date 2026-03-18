<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\InventoryItem;
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
                'status' => 'planned',
            ],
            [
                'key' => 'products',
                'title' => 'Products',
                'description' => 'Catalog growth, pricing, top sellers, and kitchen/category coverage.',
                'status' => 'planned',
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
                'status' => 'planned',
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
        if ($module === 'orders') {
            return $this->buildOrdersReport($startDate, $endDate, $branchId);
        }

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
                'Recommended next rollout order: Inventory, Finance, Products, Employees, Branches, Users.',
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
            ->selectRaw('COALESCE(products.name, order_items.product_name_snapshot, order_items.product_name, \'Unknown\') as product_name')
            ->selectRaw('SUM(order_items.quantity) as total_quantity')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.status', '!=', 'cancelled');

        if ($branchId !== null) {
            $topProductsQuery->where('orders.branch_id', $branchId);
        }

        $topProducts = $topProductsQuery
            ->groupBy('products.name', 'order_items.product_name_snapshot', 'order_items.product_name')
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
            'statusBreakdown' => collect($statusBuckets)->map(
                fn ($count, $status) => [
                    'label' => str_replace('_', ' ', ucfirst($status)),
                    'value' => $count,
                ]
            )->values()->all(),
            'branchBreakdown' => $branchBreakdown,
            'topProducts' => $topProducts,
            'exportNotes' => [
                'Use Print for paper output or Save as PDF from the browser print dialog.',
                'Excel export is delivered as CSV so managers can open it directly in Excel.',
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
