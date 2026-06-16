<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\Branch;
use App\Models\CashMovement;
use App\Models\EmployeeAdvance;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinanceAccount;
use App\Models\InventoryItem;
use App\Services\Finance\PayrollExpenseSyncService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function __construct(
        private readonly PayrollExpenseSyncService $payrollExpenseSyncService,
    ) {}

    public function index(Request $request)
    {
        return $this->marketIndex($request);
    }

    public function generalLedger(Request $request)
    {
        $validated = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,this_week,this_month,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'category' => ['nullable', 'exists:expense_categories,id'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        [$startDate, $endDate, $range] = $this->resolveDateRange($validated);

        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $paymentMethod = $validated['payment_method'] ?? null;
        $category = $validated['category'] ?? null;

        $allEntries = $this->buildMarketLedger(
            startDate: $startDate,
            endDate: $endDate,
            branchId: $branchId,
            category: $category,
            limit: null,
        );

        $perPage = 10;
        $currentPage = max(1, (int) ($validated['page'] ?? 1));
        $paginatedEntries = new LengthAwarePaginator(
            $allEntries->slice(($currentPage - 1) * $perPage, $perPage)->values(),
            $allEntries->count(),
            $perPage,
            $currentPage,
            [
                'path' => route('finance.general-ledger.index'),
                'query' => request()->except('page'),
            ],
        );

        return Inertia::render('finance/general-ledger/index', [
            'filters' => [
                'range' => $range,
                'startDate' => $startDate->toDateString(),
                'endDate' => $endDate->toDateString(),
                'branchId' => $branchId,
                'paymentMethod' => $paymentMethod,
                'category' => $category,
            ],
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'expenseCategories' => ExpenseCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (ExpenseCategory $expenseCategory) => [
                    'value' => (string) $expenseCategory->id,
                    'label' => $expenseCategory->name,
                ])
                ->values(),
            'entries' => $paginatedEntries->items(),
            'pagination' => [
                'currentPage' => $paginatedEntries->currentPage(),
                'lastPage' => $paginatedEntries->lastPage(),
                'perPage' => $paginatedEntries->perPage(),
                'total' => $paginatedEntries->total(),
                'from' => $paginatedEntries->firstItem(),
                'to' => $paginatedEntries->lastItem(),
                'hasMorePages' => $paginatedEntries->hasMorePages(),
            ],
        ]);
    }

    public function inventoryValuation(Request $request)
    {
        $validated = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,this_week,this_month,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        [$startDate, $endDate, $range] = $this->resolveDateRange($validated);
        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;

        $valuationItems = InventoryItem::query()
            ->with(['branch:id,name', 'vendor:id,name'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderByDesc(DB::raw('quantity * unit_price'))
            ->orderBy('name')
            ->get()
            ->map(function (InventoryItem $item) {
                $latestWeightedAverageCost = DB::table('inventory_transactions')
                    ->where('inventory_item_id', $item->id)
                    ->whereNotNull('weighted_average_cost_after')
                    ->orderByDesc('created_at')
                    ->value('weighted_average_cost_after');

                $averageCost = $latestWeightedAverageCost !== null
                    ? (float) $latestWeightedAverageCost
                    : (float) ($item->unit_price ?? 0);

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'branch' => $item->branch?->name ?? 'Unassigned',
                    'vendor' => $item->vendor?->name ?? '-',
                    'quantity' => (float) $item->quantity,
                    'unit' => $item->unit ?? 'unit',
                    'averageCost' => $averageCost,
                    'stockValue' => (float) $item->quantity * $averageCost,
                    'currencySymbol' => $item->currency_symbol ?? '؋',
                ];
            })
            ->values();

        $transactionBaseQuery = DB::table('inventory_transactions')
            ->join('inventory_items', 'inventory_items.id', '=', 'inventory_transactions.inventory_item_id')
            ->leftJoin('branches', 'branches.id', '=', 'inventory_items.branch_id')
            ->when($branchId, fn ($query) => $query->where('inventory_items.branch_id', $branchId))
            ->whereBetween('inventory_transactions.created_at', [$startDate, $endDate]);

        $costExpression = 'COALESCE(inventory_transactions.total_cost, ABS(inventory_transactions.quantity) * inventory_items.unit_price)';

        $summary = [
            'inventoryValue' => (float) $valuationItems->sum('stockValue'),
            'stockItems' => (int) $valuationItems->count(),
            'stockQuantity' => (float) $valuationItems->sum('quantity'),
            'cogs' => (float) (clone $transactionBaseQuery)
                ->whereIn('inventory_transactions.action', ['usage_cycle', 'issue', 'consumed'])
                ->selectRaw("COALESCE(SUM($costExpression), 0) as total")
                ->value('total'),
            'wastage' => (float) (clone $transactionBaseQuery)
                ->where('inventory_transactions.action', 'wastage')
                ->selectRaw("COALESCE(SUM($costExpression), 0) as total")
                ->value('total'),
            'adjustmentIn' => (float) (clone $transactionBaseQuery)
                ->where('inventory_transactions.action', 'adjustment')
                ->where('inventory_transactions.quantity', '>', 0)
                ->selectRaw("COALESCE(SUM($costExpression), 0) as total")
                ->value('total'),
            'adjustmentOut' => (float) (clone $transactionBaseQuery)
                ->where('inventory_transactions.action', 'adjustment')
                ->where('inventory_transactions.quantity', '<', 0)
                ->selectRaw("COALESCE(SUM($costExpression), 0) as total")
                ->value('total'),
        ];

        $movementEntries = (clone $transactionBaseQuery)
            ->select([
                'inventory_transactions.id',
                'inventory_transactions.action',
                'inventory_transactions.quantity',
                'inventory_transactions.unit_cost',
                'inventory_transactions.total_cost',
                'inventory_transactions.weighted_average_cost_after',
                'inventory_transactions.note',
                'inventory_transactions.created_at',
                'inventory_items.name as item_name',
                'inventory_items.unit as item_unit',
                'inventory_items.unit_price as fallback_unit_price',
                'branches.name as branch_name',
            ])
            ->orderByDesc('inventory_transactions.created_at')
            ->get()
            ->map(function ($row) {
                $estimatedCost = $row->total_cost !== null
                    ? (float) $row->total_cost
                    : abs((float) $row->quantity) * (float) ($row->fallback_unit_price ?? 0);

                return [
                    'id' => (int) $row->id,
                    'date' => (string) $row->created_at,
                    'action' => str($row->action)->replace('_', ' ')->title()->toString(),
                    'itemName' => (string) $row->item_name,
                    'branch' => $row->branch_name ?? 'Unassigned',
                    'quantity' => (float) $row->quantity,
                    'unit' => $row->item_unit ?? 'unit',
                    'unitCost' => $row->unit_cost !== null
                        ? (float) $row->unit_cost
                        : (float) ($row->fallback_unit_price ?? 0),
                    'totalCost' => $estimatedCost,
                    'weightedAverageCostAfter' => $row->weighted_average_cost_after !== null
                        ? (float) $row->weighted_average_cost_after
                        : null,
                    'note' => $row->note,
                ];
            })
            ->values();

        $perPage = 5;
        $currentPage = max(1, (int) ($validated['page'] ?? 1));
        $paginatedMovements = new LengthAwarePaginator(
            $movementEntries->slice(($currentPage - 1) * $perPage, $perPage)->values(),
            $movementEntries->count(),
            $perPage,
            $currentPage,
            [
                'path' => route('finance.inventory-valuation.index'),
                'query' => request()->except('page'),
            ],
        );

        return Inertia::render('finance/inventory-valuation/index', [
            'filters' => [
                'range' => $range,
                'startDate' => $startDate->toDateString(),
                'endDate' => $endDate->toDateString(),
                'branchId' => $branchId,
            ],
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'summary' => $summary,
            'valuationItems' => $valuationItems->take(40)->values(),
            'movementEntries' => $paginatedMovements->items(),
            'pagination' => [
                'currentPage' => $paginatedMovements->currentPage(),
                'lastPage' => $paginatedMovements->lastPage(),
                'perPage' => $paginatedMovements->perPage(),
                'total' => $paginatedMovements->total(),
                'from' => $paginatedMovements->firstItem(),
                'to' => $paginatedMovements->lastItem(),
                'hasMorePages' => $paginatedMovements->hasMorePages(),
            ],
        ]);
    }

    protected function resolveDateRange(array $validated): array
    {
        $range = $validated['range'] ?? 'today';
        $today = Carbon::today();

        return match ($range) {
            'yesterday' => [$today->copy()->subDay()->startOfDay(), $today->copy()->subDay()->endOfDay(), $range],
            'this_week' => [$today->copy()->startOfWeek(), $today->copy()->endOfWeek(), $range],
            'this_month' => [$today->copy()->startOfMonth(), $today->copy()->endOfMonth(), $range],
            'custom' => [
                Carbon::parse($validated['start_date'] ?? $today->toDateString())->startOfDay(),
                Carbon::parse($validated['end_date'] ?? $today->toDateString())->endOfDay(),
                $range,
            ],
            default => [$today->copy()->startOfDay(), $today->copy()->endOfDay(), 'today'],
        };
    }

    private function marketIndex(Request $request)
    {
        $this->payrollExpenseSyncService->syncMissingPaidItems();

        $validated = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,this_week,this_month,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'category' => ['nullable', 'exists:expense_categories,id'],
        ]);

        [$startDate, $endDate, $range] = $this->resolveDateRange($validated);
        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $paymentMethod = $validated['payment_method'] ?? null;
        $category = $validated['category'] ?? null;

        $expenseQuery = Expense::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($category, fn ($query) => $query->where('expense_category_id', $category))
            ->where('approval_status', 'approved')
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()]);

        $expensesTotal = (float) (clone $expenseQuery)->sum('amount');
        $inventoryValue = (float) InventoryItem::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->selectRaw('COALESCE(SUM(quantity * unit_price), 0) as total')
            ->value('total');
        $supplierBalances = (float) InventoryItem::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->selectRaw('COALESCE(SUM(CASE WHEN (quantity * unit_price) > paid_amount THEN (quantity * unit_price) - paid_amount ELSE 0 END), 0) as total')
            ->value('total');
        $cashPosition = (float) CashMovement::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('approval_status', 'approved')
            ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total")
            ->value('total');
        $unpaidSalaries = Schema::hasTable('payroll_run_items')
            ? (float) DB::table('payroll_run_items')->where('payment_status', '!=', 'paid')->sum('net_salary')
            : 0.0;

        $expenseTrend = (clone $expenseQuery)
            ->selectRaw('DATE(expense_date) as bucket, COALESCE(SUM(amount), 0) as total')
            ->groupBy('bucket')
            ->pluck('total', 'bucket');
        $trend = collect(CarbonPeriod::create($startDate->copy()->startOfDay(), $endDate->copy()->startOfDay()))
            ->map(fn (Carbon $date) => [
                'date' => $date->toDateString(),
                'label' => $date->format('M d'),
                'sales' => 0,
                'expenses' => (float) ($expenseTrend[$date->toDateString()] ?? 0),
                'net' => -(float) ($expenseTrend[$date->toDateString()] ?? 0),
            ])->values();

        $topExpenseCategories = (clone $expenseQuery)
            ->leftJoin('expense_categories', 'expense_categories.id', '=', 'expenses.expense_category_id')
            ->selectRaw('COALESCE(expense_categories.slug, expenses.expense_type, "uncategorized") as value')
            ->selectRaw('COALESCE(expense_categories.name, expenses.expense_type, "Uncategorized") as category')
            ->selectRaw('COALESCE(SUM(expenses.amount), 0) as amount')
            ->groupBy('value', 'category')
            ->orderByDesc('amount')
            ->limit(6)
            ->get();

        $generalLedger = $this->buildMarketLedger($startDate, $endDate, $branchId, $category, 12);

        return Inertia::render('finance/index', [
            'filters' => [
                'range' => $range,
                'startDate' => $startDate->toDateString(),
                'endDate' => $endDate->toDateString(),
                'branchId' => $branchId,
                'paymentMethod' => $paymentMethod,
                'category' => $category,
            ],
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'expenseCategories' => ExpenseCategory::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get(['id', 'name'])->map(fn ($item) => ['value' => (string) $item->id, 'label' => $item->name]),
            'projectionHealth' => [
                'usesProjectionData' => false,
                'status' => 'unavailable',
                'message' => 'Finance metrics use live accounting records.',
                'latestProjectionAt' => null,
                'staleBranchCount' => 0,
                'criticalBranchCount' => 0,
                'warningBranchCount' => 0,
                'branches' => [],
            ],
            'dashboard' => [
                'summary' => [
                    'sales' => 0,
                    'expenses' => $expensesTotal,
                    'grossProfit' => null,
                    'netProfit' => -$expensesTotal,
                    'cashPosition' => $cashPosition,
                    'unpaidSalaries' => $unpaidSalaries,
                    'inventoryValue' => $inventoryValue,
                    'supplierBalances' => $supplierBalances,
                ],
                'trend' => $trend,
                'branchRevenue' => [],
                'topExpenseCategories' => $topExpenseCategories,
                'paymentBreakdown' => [],
                'ledgerStats' => [
                    'accounts' => FinanceAccount::query()->count(),
                    'journals' => Schema::hasTable('finance_journals') ? DB::table('finance_journals')->count() : 0,
                    'draft_journals' => Schema::hasTable('finance_journals') ? DB::table('finance_journals')->where('approval_status', 'draft')->count() : 0,
                    'approval_queue' => Expense::query()->where('approval_status', 'submitted')->count(),
                ],
                'generalLedger' => $generalLedger,
                'generalLedgerPreview' => $generalLedger->take(5)->values(),
                'modules' => [
                    ['name' => 'Chart of Accounts', 'description' => 'Assets, liabilities, equity, revenue, and expenses.', 'status' => 'Ready'],
                    ['name' => 'General Ledger', 'description' => 'Approved accounting activity and journals.', 'status' => 'Ready'],
                    ['name' => 'Expenses', 'description' => 'Expense recording and approval workflows.', 'status' => 'Ready'],
                    ['name' => 'Payroll', 'description' => 'Payroll runs and outstanding salary visibility.', 'status' => 'Ready'],
                    ['name' => 'Cash & Bank', 'description' => 'Cash movements, deposits, and withdrawals.', 'status' => 'Ready'],
                    ['name' => 'Inventory Valuation', 'description' => 'Stock valuation and inventory cost movements.', 'status' => 'Ready'],
                ],
                'notes' => [
                    'grossProfit' => 'Revenue recognition will be configured with the market sales workflow.',
                    'cashPosition' => 'Approved cash inflows minus approved cash outflows.',
                ],
            ],
        ]);
    }

    private function buildMarketLedger(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
        ?string $category,
        ?int $limit,
    ) {
        $expenses = Expense::query()
            ->with('branch:id,name')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($category, fn ($query) => $query->where('expense_category_id', $category))
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get()
            ->map(fn (Expense $expense) => [
                'date' => (string) $expense->expense_date,
                'reference' => 'Expense #'.$expense->id,
                'type' => 'Expense',
                'branch' => $expense->branch?->name ?? 'Unassigned',
                'account' => $expense->expense_type ?? 'Expense',
                'description' => $expense->title,
                'debit' => (float) $expense->amount,
                'credit' => 0,
                'status' => $expense->approval_status ?? 'draft',
            ]);

        $movements = CashMovement::query()
            ->with('branch:id,name')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('movement_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get()
            ->map(fn (CashMovement $movement) => [
                'date' => (string) $movement->movement_date,
                'reference' => 'Cash #'.$movement->id,
                'type' => 'Cash Movement',
                'branch' => $movement->branch?->name ?? 'Unassigned',
                'account' => $movement->movement_type ?? 'Cash',
                'description' => $movement->description ?? $movement->title ?? 'Cash movement',
                'debit' => $movement->direction === 'out' ? (float) $movement->amount : 0,
                'credit' => $movement->direction === 'in' ? (float) $movement->amount : 0,
                'status' => $movement->approval_status ?? 'draft',
            ]);

        $entries = $expenses->merge($movements)->sortByDesc('date')->values();

        return $limit === null ? $entries : $entries->take($limit)->values();
    }

}
