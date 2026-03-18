<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
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
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        return Inertia::render('reports/index', $this->buildReportPageData($request));
    }

    public function exportPdf(Request $request)
    {
        $data = $this->buildReportPageData($request);
        $report = $data['activeReport'];

        abort_unless(($report['isReady'] ?? false) === true, 404);

        $pdf = Pdf::loadView('reports/pdf', [
            'report' => $report,
            'period' => $data['period'],
            'filters' => $data['filters'],
            'branchName' => $this->resolveBranchName($data),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->exportFilename(
            (string) $data['filters']['module'],
            (string) $data['period']['startDate'],
            (string) $data['period']['endDate'],
            'pdf',
        ));
    }

    public function exportXlsx(Request $request): StreamedResponse
    {
        $data = $this->buildReportPageData($request);
        $report = $data['activeReport'];

        abort_unless(($report['isReady'] ?? false) === true, 404);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr((string) ($report['title'] ?? 'Report'), 0, 31));

        $row = 1;
        $sheet->setCellValue("A{$row}", (string) ($report['title'] ?? 'Report'));
        $row++;
        $sheet->setCellValue("A{$row}", 'Reporting period');
        $sheet->setCellValue("B{$row}", (string) ($data['period']['label'] ?? ''));
        $row++;
        $sheet->setCellValue("A{$row}", 'Branch scope');
        $sheet->setCellValue("B{$row}", $this->resolveBranchName($data));
        $row += 2;

        $summary = $report['summary'] ?? [];
        if ($summary !== []) {
            $sheet->setCellValue("A{$row}", 'Summary');
            $row++;
            $sheet->setCellValue("A{$row}", 'Metric');
            $sheet->setCellValue("B{$row}", 'Value');
            $row++;

            foreach ($summary as $item) {
                $sheet->setCellValue("A{$row}", (string) ($item['label'] ?? ''));
                $sheet->setCellValue("B{$row}", (float) ($item['value'] ?? 0));
                $row++;
            }

            $row++;
        }

        $columns = $report['columns'] ?? [];
        $rows = $report['rows'] ?? [];
        $currencyColumns = collect($report['currencyColumns'] ?? [])->map(fn ($column) => (string) $column)->all();

        foreach ($columns as $columnIndex => $column) {
            $sheet->setCellValueByColumnAndRow($columnIndex + 1, $row, (string) ($column['label'] ?? ''));
        }
        $row++;

        foreach ($rows as $reportRow) {
            foreach ($columns as $columnIndex => $column) {
                $key = (string) ($column['key'] ?? '');
                $value = $reportRow[$key] ?? '';
                $cellValue = in_array($key, $currencyColumns, true)
                    ? (float) $value
                    : (string) $value;

                $sheet->setCellValueByColumnAndRow($columnIndex + 1, $row, $cellValue);
            }

            $row++;
        }

        foreach (range(1, max(1, count($columns))) as $columnIndex) {
            $sheet->getColumnDimensionByColumn($columnIndex)->setAutoSize(true);
        }

        $filename = $this->exportFilename(
            (string) $data['filters']['module'],
            (string) $data['period']['startDate'],
            (string) $data['period']['endDate'],
            'xlsx',
        );

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function buildReportPageData(Request $request): array
    {
        $validated = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,this_week,this_month,last_30_days,year_to_date,custom'],
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

        return [
            'branches' => Branch::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->toArray(),
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
        ];
    }

    private function exportFilename(
        string $module,
        string $startDate,
        string $endDate,
        string $extension,
    ): string {
        return sprintf(
            '%s-report-%s-to-%s.%s',
            $module,
            $startDate,
            $endDate,
            $extension,
        );
    }

    private function resolveBranchName(array $data): string
    {
        $branch = collect($data['branches'])->firstWhere('id', $data['filters']['branchId']);

        return is_array($branch) ? (string) ($branch['name'] ?? 'All Branches') : 'All Branches';
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
            'year_to_date' => [$today->copy()->startOfYear(), $today->copy()->endOfDay()],
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
                'status' => 'live',
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
                'status' => 'live',
            ],
            [
                'key' => 'users',
                'title' => 'Users',
                'description' => 'Access activity, onboarding, and branch-level user distribution.',
                'status' => 'live',
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
            'employees' => $this->buildEmployeesReport($startDate, $endDate, $branchId),
            'branches' => $this->buildBranchesReport($startDate, $endDate, $branchId),
            'users' => $this->buildUsersReport($startDate, $endDate, $branchId),
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
                'Download PDF for a server-rendered printable report package.',
                'Download Excel for a native .xlsx workbook built from the current report view.',
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

    private function buildEmployeesReport(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        $employees = Employee::query()
            ->with([
                'branch:id,name',
                'employmentType:id,name',
                'employeePosition:id,name',
                'shift:id,name',
            ])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->orderBy('first_name')
            ->get();

        $advances = \App\Models\EmployeeAdvance::query()
            ->with(['employee:id,first_name,last_name', 'branch:id,name'])
            ->whereBetween('advance_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $contracts = \App\Models\EmployeeContract::query()
            ->with(['employee:id,first_name,last_name', 'branch:id,name'])
            ->whereBetween('start_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $payrollItems = \App\Models\PayrollRunItem::query()
            ->with(['employee:id,first_name,last_name', 'payrollRun.branch:id,name'])
            ->whereHas('payrollRun', function (Builder $query) use ($startDate, $endDate, $branchId) {
                $query->whereDate('period_start', '<=', $endDate->toDateString())
                    ->whereDate('period_end', '>=', $startDate->toDateString())
                    ->when($branchId, fn (Builder $inner) => $inner->where('branch_id', $branchId));
            })
            ->get();

        $rows = $employees->map(function (Employee $employee) use ($advances, $contracts, $payrollItems) {
            $employeeAdvances = $advances->where('employee_id', $employee->id);
            $employeeContracts = $contracts->where('employee_id', $employee->id);
            $employeePayrollItems = $payrollItems->where('employee_id', $employee->id);

            return [
                'employee' => trim($employee->first_name.' '.$employee->last_name),
                'branch' => $employee->branch?->name ?? 'Unassigned',
                'employmentType' => $employee->employmentType?->name ?? '-',
                'position' => $employee->employeePosition?->name ?? '-',
                'shift' => $employee->shift?->name ?? '-',
                'status' => str($employee->status ?? ($employee->is_active ? 'active' : 'inactive'))
                    ->replace('_', ' ')
                    ->title()
                    ->toString(),
                'salary' => (float) ($employee->salary ?? 0),
                'advances' => (float) $employeeAdvances->sum('amount'),
                'contracts' => (float) $employeeContracts->sum('contract_amount'),
                'payrollNet' => (float) $employeePayrollItems->sum('net_salary'),
            ];
        })->sortBy('employee')->values();

        $branchStaffing = $rows
            ->groupBy('branch')
            ->map(fn ($group, $branch) => [
                'label' => $branch,
                'value' => number_format((float) $group->count(), 0).' employees',
                'meta' => 'Payroll '.number_format((float) $group->sum('payrollNet'), 0),
            ])
            ->take(5)
            ->values()
            ->all();

        $employmentMix = $rows
            ->groupBy('employmentType')
            ->map(fn ($group, $type) => [
                'label' => $type,
                'value' => number_format((float) $group->count(), 0).' employees',
            ])
            ->take(5)
            ->values()
            ->all();

        $advanceExposure = $rows
            ->sortByDesc('advances')
            ->take(5)
            ->map(fn ($row) => [
                'label' => $row['employee'],
                'value' => number_format((float) $row['advances'], 0),
                'meta' => $row['branch'],
            ])
            ->values()
            ->all();

        return [
            'key' => 'employees',
            'title' => 'Employees Report',
            'description' => 'Headcount, compensation, advances, and contract activity across the workforce.',
            'isReady' => true,
            'status' => 'live',
            'currencyColumns' => ['salary', 'advances', 'contracts', 'payrollNet'],
            'columns' => [
                ['key' => 'employee', 'label' => 'Employee'],
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'employmentType', 'label' => 'Employment'],
                ['key' => 'position', 'label' => 'Position'],
                ['key' => 'shift', 'label' => 'Shift'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'salary', 'label' => 'Salary'],
                ['key' => 'advances', 'label' => 'Advances'],
                ['key' => 'contracts', 'label' => 'Contracts'],
                ['key' => 'payrollNet', 'label' => 'Payroll Net'],
            ],
            'rows' => $rows->all(),
            'summary' => [
                ['label' => 'Employees', 'value' => (int) $rows->count(), 'format' => 'number'],
                ['label' => 'Active Employees', 'value' => (int) $employees->where('is_active', true)->count(), 'format' => 'number'],
                ['label' => 'Advances Total', 'value' => (float) $advances->sum('amount'), 'format' => 'currency'],
                ['label' => 'Payroll Net', 'value' => (float) $payrollItems->sum('net_salary'), 'format' => 'currency'],
            ],
            'insights' => [
                [
                    'title' => 'Branch staffing',
                    'description' => 'Headcount and payroll concentration by branch.',
                    'items' => $branchStaffing,
                ],
                [
                    'title' => 'Employment mix',
                    'description' => 'How the workforce is distributed by employment type.',
                    'items' => $employmentMix,
                ],
                [
                    'title' => 'Advance exposure',
                    'description' => 'Employees with the largest advance totals in the selected period.',
                    'items' => $advanceExposure,
                ],
            ],
            'exportNotes' => [
                'Payroll Net is based on payroll items overlapping the selected date window.',
                'Advance and contract amounts are scoped to records created within the same period.',
            ],
        ];
    }

    private function buildBranchesReport(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        $branches = Branch::query()
            ->when($branchId, fn (Builder $query) => $query->where('id', $branchId))
            ->orderBy('name')
            ->get();

        $orders = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $inventoryItems = InventoryItem::query()
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $employees = Employee::query()
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $users = User::query()
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $expenses = Expense::query()
            ->whereBetween('expense_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $rows = $branches->map(function (Branch $branch) use ($orders, $inventoryItems, $employees, $users, $expenses) {
            $branchOrders = $orders->where('branch_id', $branch->id);
            $completedRevenue = (float) $branchOrders
                ->where('status', 'completed')
                ->sum('total_amount');

            return [
                'branch' => $branch->name,
                'status' => $branch->is_active ? 'Active' : 'Inactive',
                'orders' => (int) $branchOrders->count(),
                'revenue' => $completedRevenue,
                'inventoryItems' => (int) $inventoryItems->where('branch_id', $branch->id)->count(),
                'employees' => (int) $employees->where('branch_id', $branch->id)->count(),
                'users' => (int) $users->where('branch_id', $branch->id)->count(),
                'expenses' => (float) $expenses->where('branch_id', $branch->id)->sum('amount'),
                'address' => $branch->address ?: '-',
            ];
        })->sortByDesc('revenue')->values();

        $revenueLeaders = $rows->take(5)->map(fn ($row) => [
            'label' => $row['branch'],
            'value' => number_format((float) $row['revenue'], 0),
            'meta' => number_format((float) $row['orders'], 0).' orders',
        ])->values()->all();

        $staffCoverage = $rows->sortByDesc('employees')->take(5)->map(fn ($row) => [
            'label' => $row['branch'],
            'value' => number_format((float) $row['employees'], 0).' employees',
            'meta' => number_format((float) $row['users'], 0).' users',
        ])->values()->all();

        $costPressure = $rows->sortByDesc('expenses')->take(5)->map(fn ($row) => [
            'label' => $row['branch'],
            'value' => number_format((float) $row['expenses'], 0),
            'meta' => 'Revenue '.number_format((float) $row['revenue'], 0),
        ])->values()->all();

        return [
            'key' => 'branches',
            'title' => 'Branches Report',
            'description' => 'Operational branch comparison across sales, staffing, inventory, and local cost load.',
            'isReady' => true,
            'status' => 'live',
            'currencyColumns' => ['revenue', 'expenses'],
            'columns' => [
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'orders', 'label' => 'Orders'],
                ['key' => 'revenue', 'label' => 'Revenue'],
                ['key' => 'inventoryItems', 'label' => 'Inventory'],
                ['key' => 'employees', 'label' => 'Employees'],
                ['key' => 'users', 'label' => 'Users'],
                ['key' => 'expenses', 'label' => 'Expenses'],
                ['key' => 'address', 'label' => 'Address'],
            ],
            'rows' => $rows->all(),
            'summary' => [
                ['label' => 'Branches', 'value' => (int) $rows->count(), 'format' => 'number'],
                ['label' => 'Branch Revenue', 'value' => (float) $rows->sum('revenue'), 'format' => 'currency'],
                ['label' => 'Branch Expenses', 'value' => (float) $rows->sum('expenses'), 'format' => 'currency'],
                ['label' => 'Branch Orders', 'value' => (float) $rows->sum('orders'), 'format' => 'number'],
            ],
            'insights' => [
                [
                    'title' => 'Revenue leaders',
                    'description' => 'Branches contributing the strongest completed sales.',
                    'items' => $revenueLeaders,
                ],
                [
                    'title' => 'Staff coverage',
                    'description' => 'Operational staffing and assigned user coverage by branch.',
                    'items' => $staffCoverage,
                ],
                [
                    'title' => 'Cost pressure',
                    'description' => 'Branches carrying the largest expense totals in the selected period.',
                    'items' => $costPressure,
                ],
            ],
            'exportNotes' => [
                'Branch revenue uses completed orders in the selected period.',
                'Inventory, employee, and user counts are live snapshots for the current branch setup.',
            ],
        ];
    }

    private function buildUsersReport(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
    ): array {
        $users = User::query()
            ->with(['roles:id,name', 'branch:id,name', 'country:id,name', 'province:id,name'])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->orderBy('name')
            ->get();

        $newUsers = $users->filter(function (User $user) use ($startDate, $endDate) {
            return $user->created_at !== null
                && $user->created_at->between($startDate, $endDate);
        });

        $orders = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->get();

        $rows = $users->map(function (User $user) use ($orders) {
            $userOrders = $orders->where('user_id', $user->id);

            return [
                'name' => $user->name,
                'email' => $user->email,
                'branch' => $user->branch?->name ?? 'Unassigned',
                'roles' => $user->roles->pluck('name')->implode(', ') ?: '-',
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'country' => $user->country?->name ?? '-',
                'province' => $user->province?->name ?? '-',
                'ordersHandled' => (int) $userOrders->count(),
                'completedRevenue' => (float) $userOrders->where('status', 'completed')->sum('total_amount'),
                'createdAt' => optional($user->created_at)->format('Y-m-d') ?? '-',
            ];
        })->sortBy('name')->values();

        $roleMix = $users
            ->flatMap(fn (User $user) => $user->roles->pluck('name'))
            ->countBy()
            ->map(fn ($count, $role) => [
                'label' => $role,
                'value' => number_format((float) $count, 0).' users',
            ])
            ->take(5)
            ->values()
            ->all();

        $branchDistribution = $rows
            ->groupBy('branch')
            ->map(fn ($group, $branch) => [
                'label' => $branch,
                'value' => number_format((float) $group->count(), 0).' users',
                'meta' => number_format((float) $group->sum('ordersHandled'), 0).' orders',
            ])
            ->take(5)
            ->values()
            ->all();

        $topOperators = $rows
            ->sortByDesc('ordersHandled')
            ->take(5)
            ->map(fn ($row) => [
                'label' => $row['name'],
                'value' => number_format((float) $row['ordersHandled'], 0).' orders',
                'meta' => 'Revenue '.number_format((float) $row['completedRevenue'], 0),
            ])
            ->values()
            ->all();

        return [
            'key' => 'users',
            'title' => 'Users Report',
            'description' => 'Access and operational user report across roles, branch assignment, and order activity.',
            'isReady' => true,
            'status' => 'live',
            'currencyColumns' => ['completedRevenue'],
            'columns' => [
                ['key' => 'name', 'label' => 'User'],
                ['key' => 'email', 'label' => 'Email'],
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'roles', 'label' => 'Roles'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'country', 'label' => 'Country'],
                ['key' => 'province', 'label' => 'Province'],
                ['key' => 'ordersHandled', 'label' => 'Orders'],
                ['key' => 'completedRevenue', 'label' => 'Revenue'],
                ['key' => 'createdAt', 'label' => 'Created'],
            ],
            'rows' => $rows->all(),
            'summary' => [
                ['label' => 'Users', 'value' => (int) $users->count(), 'format' => 'number'],
                ['label' => 'Active Users', 'value' => (int) $users->where('is_active', true)->count(), 'format' => 'number'],
                ['label' => 'New Users', 'value' => (int) $newUsers->count(), 'format' => 'number'],
                ['label' => 'Handled Revenue', 'value' => (float) $rows->sum('completedRevenue'), 'format' => 'currency'],
            ],
            'insights' => [
                [
                    'title' => 'Role mix',
                    'description' => 'How user access is distributed across roles.',
                    'items' => $roleMix,
                ],
                [
                    'title' => 'Branch distribution',
                    'description' => 'Assigned users and related order volume by branch.',
                    'items' => $branchDistribution,
                ],
                [
                    'title' => 'Top operators',
                    'description' => 'Users handling the most order activity in the selected period.',
                    'items' => $topOperators,
                ],
            ],
            'exportNotes' => [
                'Handled Revenue is attributed from completed orders linked to each user during the selected period.',
                'Role and branch assignment data are current snapshots of user access configuration.',
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
