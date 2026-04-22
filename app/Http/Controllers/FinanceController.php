<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Branch;
use App\Models\BranchDailyMetric;
use App\Models\CashMovement;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinanceAccount;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Services\Finance\PayrollExpenseSyncService;
use App\Services\Projection\BranchDailyMetricReader;
use App\Services\Projection\ProjectionHealthService;
use App\Services\Projection\ProjectionDispatchService;
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
        private readonly ProjectionDispatchService $projectionDispatchService,
        private readonly BranchDailyMetricReader $branchDailyMetricReader,
        private readonly ProjectionHealthService $projectionHealthService,
        private readonly PayrollExpenseSyncService $payrollExpenseSyncService,
    ) {}

    public function index(Request $request)
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
        $canUseProjectedFinanceData = $paymentMethod === null && $category === null;
        $hasProjectedFinanceData = $canUseProjectedFinanceData
            ? BranchDailyMetric::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->whereBetween('metric_date', [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ])
                ->exists()
            : false;
        $useProjectedFinanceData = $canUseProjectedFinanceData && $hasProjectedFinanceData;

        $salesTotal = $useProjectedFinanceData
            ? $this->branchDailyMetricReader->sumCompletedSales($startDate, $endDate, $branchId)
            : (float) $this->salesQuery($startDate, $endDate, $branchId, $paymentMethod)
                ->sum('total_amount');

        $houseCompTotal = (float) Order::query()
            ->where('status', OrderStatus::COMPLETED->value)
            ->where('covered_by_type', 'house')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');

        $employeeCoveredTotal = Schema::hasTable('payments')
            ? (float) DB::table('payments')
                ->join('orders', 'orders.id', '=', 'payments.order_id')
                ->where('orders.status', OrderStatus::COMPLETED->value)
                ->where('payments.status', 'covered_by_employee')
                ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->sum('payments.amount')
            : 0.0;

        $expensesTotal = $useProjectedFinanceData
            ? $this->branchDailyMetricReader->sumExpenses($startDate, $endDate, $branchId)
            : (float) Expense::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->when($category, fn ($query) => $query->where('expense_category_id', $category))
                ->where('approval_status', 'approved')
                ->whereBetween('expense_date', [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ])
                ->sum('amount');

        $inventoryValue = Schema::hasTable('inventory_items')
            ? (float) DB::table('inventory_items')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->selectRaw('COALESCE(SUM(quantity * unit_price), 0) as total')
                ->value('total')
            : 0.0;

        $supplierBalances = Schema::hasTable('inventory_items')
            ? (float) DB::table('inventory_items')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->selectRaw(
                    'COALESCE(SUM(CASE WHEN ((quantity * unit_price) - paid_amount) > 0 THEN ((quantity * unit_price) - paid_amount) ELSE 0 END), 0) as total'
                )
                ->value('total')
            : 0.0;

        $cashSalesFromPayments = Schema::hasTable('payments')
            ? (float) DB::table('payments')
                ->join('orders', 'orders.id', '=', 'payments.order_id')
                ->where('orders.status', OrderStatus::COMPLETED->value)
                ->where('payments.method', 'cash')
                ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
                ->sum('payments.amount')
            : 0.0;

        $cashSalesFromLegacyOrders = Schema::hasTable('orders')
            ? (float) Order::query()
                ->where('orders.status', OrderStatus::COMPLETED->value)
                ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
                ->doesntHave('payments')
                ->sum('paid_amount')
            : 0.0;

        $cashSales = $cashSalesFromPayments + $cashSalesFromLegacyOrders;

        $cashExpenses = Schema::hasColumn('expenses', 'payment_method')
            ? (float) DB::table('expenses')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('payment_method', 'cash')
                ->where('approval_status', 'approved')
                ->sum('amount')
            : 0.0;

        $cashMovementsNet = Schema::hasTable('cash_movements')
            ? (float) DB::table('cash_movements')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'approved')
                ->selectRaw(
                    "COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total"
                )
                ->value('total')
            : 0.0;

        $cashPosition = $cashSales - $cashExpenses + $cashMovementsNet;

        $liabilityMonthStart = $endDate->copy()->startOfMonth()->toDateString();
        $liabilityMonthEnd = $endDate->copy()->endOfMonth()->toDateString();

        $fixedSalaryPayrollItems = Schema::hasTable('payroll_run_items') && Schema::hasTable('payroll_runs')
            ? DB::table('payroll_run_items')
                ->join('payroll_runs', 'payroll_runs.id', '=', 'payroll_run_items.payroll_run_id')
                ->when($branchId, fn ($query) => $query->where('payroll_runs.branch_id', $branchId))
                ->where('payroll_run_items.salary_type', 'fixed_salary')
                ->where('payroll_run_items.payment_status', '!=', 'paid')
                ->whereDate('payroll_runs.period_start', '<=', $liabilityMonthEnd)
                ->whereDate('payroll_runs.period_end', '>=', $liabilityMonthStart)
                ->select('payroll_run_items.employee_id')
                ->selectRaw('COALESCE(SUM(payroll_run_items.net_salary), 0) as total')
                ->groupBy('payroll_run_items.employee_id')
                ->get()
            : collect();

        $fixedSalaryHandledEmployeeIds = Schema::hasTable('payroll_run_items') && Schema::hasTable('payroll_runs')
            ? DB::table('payroll_run_items')
                ->join('payroll_runs', 'payroll_runs.id', '=', 'payroll_run_items.payroll_run_id')
                ->when($branchId, fn ($query) => $query->where('payroll_runs.branch_id', $branchId))
                ->where('payroll_run_items.salary_type', 'fixed_salary')
                ->whereDate('payroll_runs.period_start', '<=', $liabilityMonthEnd)
                ->whereDate('payroll_runs.period_end', '>=', $liabilityMonthStart)
                ->distinct()
                ->pluck('payroll_run_items.employee_id')
            : collect();

        $unpaidFixedSalaryTotal = (float) $fixedSalaryPayrollItems->sum('total');

        $fallbackFixedSalaryTotal = Schema::hasTable('employees')
            ? (float) DB::table('employees')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('is_active', true)
                ->where('salary', '>', 0)
                ->when(
                    $fixedSalaryHandledEmployeeIds->isNotEmpty(),
                    fn ($query) => $query->whereNotIn('id', $fixedSalaryHandledEmployeeIds->all()),
                )
                ->sum('salary')
            : 0.0;

        $contractPayrollItems = Schema::hasTable('payroll_run_items') && Schema::hasTable('payroll_runs')
            ? DB::table('payroll_run_items')
                ->join('payroll_runs', 'payroll_runs.id', '=', 'payroll_run_items.payroll_run_id')
                ->when($branchId, fn ($query) => $query->where('payroll_runs.branch_id', $branchId))
                ->where('payroll_run_items.salary_type', 'contract_payment')
                ->where('payroll_run_items.payment_status', '!=', 'paid')
                ->whereDate('payroll_runs.period_start', '<=', $liabilityMonthEnd)
                ->whereDate('payroll_runs.period_end', '>=', $liabilityMonthStart)
                ->select('payroll_run_items.employee_id')
                ->selectRaw('COALESCE(SUM(payroll_run_items.net_salary), 0) as total')
                ->groupBy('payroll_run_items.employee_id')
                ->get()
            : collect();

        $contractHandledEmployeeIds = Schema::hasTable('payroll_run_items') && Schema::hasTable('payroll_runs')
            ? DB::table('payroll_run_items')
                ->join('payroll_runs', 'payroll_runs.id', '=', 'payroll_run_items.payroll_run_id')
                ->when($branchId, fn ($query) => $query->where('payroll_runs.branch_id', $branchId))
                ->where('payroll_run_items.salary_type', 'contract_payment')
                ->whereDate('payroll_runs.period_start', '<=', $liabilityMonthEnd)
                ->whereDate('payroll_runs.period_end', '>=', $liabilityMonthStart)
                ->distinct()
                ->pluck('payroll_run_items.employee_id')
            : collect();

        $unpaidContractPayrollTotal = (float) $contractPayrollItems->sum('total');

        $fallbackContractScheduleTotal = Schema::hasTable('employee_contract_payment_schedules') && Schema::hasTable('employee_contracts')
            ? (float) DB::table('employee_contract_payment_schedules')
                ->join('employee_contracts', 'employee_contracts.id', '=', 'employee_contract_payment_schedules.employee_contract_id')
                ->when($branchId, fn ($query) => $query->where('employee_contracts.branch_id', $branchId))
                ->whereIn('employee_contracts.status', ['submitted', 'approved', 'active'])
                ->whereBetween('employee_contract_payment_schedules.due_date', [
                    $liabilityMonthStart,
                    $liabilityMonthEnd,
                ])
                ->whereIn('employee_contract_payment_schedules.status', ['submitted', 'approved'])
                ->when(
                    $contractHandledEmployeeIds->isNotEmpty(),
                    fn ($query) => $query->whereNotIn('employee_contracts.employee_id', $contractHandledEmployeeIds->all()),
                )
                ->sum('employee_contract_payment_schedules.amount')
            : 0.0;

        $unpaidSalaries = $unpaidFixedSalaryTotal
            + $fallbackFixedSalaryTotal
            + $unpaidContractPayrollTotal
            + $fallbackContractScheduleTotal;

        $weightedCogs = Schema::hasColumn('inventory_transactions', 'total_cost')
            ? (float) DB::table('inventory_transactions')
                ->join('inventory_items', 'inventory_items.id', '=', 'inventory_transactions.inventory_item_id')
                ->when($branchId, fn ($query) => $query->where('inventory_items.branch_id', $branchId))
                ->whereIn('inventory_transactions.action', ['issue', 'consumed', 'wastage', 'adjustment_out'])
                ->whereBetween('inventory_transactions.created_at', [$startDate, $endDate])
                ->sum('inventory_transactions.total_cost')
            : null;

        $grossProfit = $weightedCogs === null
            ? null
            : (float) $salesTotal - (float) $weightedCogs;

        $netProfit = ($grossProfit ?? (float) $salesTotal) - (float) $expensesTotal;

        if ($useProjectedFinanceData) {
            $trend = $this->branchDailyMetricReader
                ->trend($startDate, $endDate, $branchId)
                ->map(fn (array $row) => [
                    ...$row,
                    'net' => $row['sales'] - $row['expenses'],
                ])
                ->values()
                ->all();

            $branchRevenue = $this->branchDailyMetricReader
                ->branchRevenue($startDate, $endDate, $branchId)
                ->values();
        } else {
            $salesTrend = $this->salesQuery($startDate, $endDate, $branchId, $paymentMethod)
                ->selectRaw('DATE(created_at) as bucket, COALESCE(SUM(total_amount), 0) as total')
                ->groupBy('bucket')
                ->pluck('total', 'bucket');

            $expenseTrend = Expense::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->when($category, fn ($query) => $query->where('expense_category_id', $category))
                ->where('approval_status', 'approved')
                ->whereBetween('expense_date', [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ])
                ->selectRaw('DATE(expense_date) as bucket, COALESCE(SUM(amount), 0) as total')
                ->groupBy('bucket')
                ->pluck('total', 'bucket');

            $trend = [];
            foreach (CarbonPeriod::create($startDate->copy()->startOfDay(), $endDate->copy()->startOfDay()) as $date) {
                $bucket = $date->toDateString();
                $sales = (float) ($salesTrend[$bucket] ?? 0);
                $expenses = (float) ($expenseTrend[$bucket] ?? 0);

                $trend[] = [
                    'date' => $bucket,
                    'label' => $date->format('M d'),
                    'sales' => $sales,
                    'expenses' => $expenses,
                    'net' => $sales - $expenses,
                ];
            }

            $branchRevenue = Order::query()
                ->join('branches', 'branches.id', '=', 'orders.branch_id')
                ->where('orders.status', OrderStatus::COMPLETED->value)
                ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
                ->when($paymentMethod, function ($query, $method) {
                    $query->whereHas('payments', fn ($paymentQuery) => $paymentQuery->where('method', $method));
                })
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->selectRaw('branches.name as branch, COALESCE(SUM(orders.total_amount), 0) as revenue')
                ->groupBy('branches.id', 'branches.name')
                ->orderByDesc('revenue')
                ->get()
                ->map(fn ($row) => [
                    'branch' => $row->branch,
                    'revenue' => (float) $row->revenue,
                ])
                ->values();
        }

        $expenseCategoryOptions = ExpenseCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (ExpenseCategory $expenseCategory) => [
                'value' => (string) $expenseCategory->id,
                'label' => $expenseCategory->name,
            ])
            ->values();

        $topExpenseCategories = Expense::query()
            ->leftJoin('expense_categories', 'expense_categories.id', '=', 'expenses.expense_category_id')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($category, fn ($query) => $query->where('expenses.expense_category_id', $category))
            ->where('expenses.approval_status', 'approved')
            ->whereBetween('expense_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->selectRaw('COALESCE(expense_categories.name, expenses.expense_type, "Uncategorized") as category_name')
            ->selectRaw('COALESCE(expense_categories.slug, expenses.expense_type, "uncategorized") as category_slug')
            ->selectRaw('COALESCE(SUM(amount), 0) as total')
            ->groupBy('category_name', 'category_slug')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'value' => (string) $row->category_slug,
                'category' => (string) $row->category_name,
                'amount' => (float) $row->total,
            ])
            ->values();

        $paymentBreakdown = Schema::hasTable('payments')
            ? DB::table('payments')
                ->join('orders', 'orders.id', '=', 'payments.order_id')
                ->where('orders.status', OrderStatus::COMPLETED->value)
                ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
                ->when($paymentMethod, fn ($query, $method) => $query->where('payments.method', $method))
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->select('payments.method')
                ->select('payments.status')
                ->selectRaw('COALESCE(SUM(payments.amount), 0) as total')
                ->groupBy('payments.method', 'payments.status')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => [
                    'method' => $row->status === 'covered_by_employee'
                        ? 'Employee Cover · '.str($row->method)->replace('_', ' ')->title()->toString()
                        : str($row->method)->replace('_', ' ')->title()->toString(),
                    'amount' => (float) $row->total,
                ])
                ->values()
            : collect();

        if ($houseCompTotal > 0) {
            $paymentBreakdown->push([
                'method' => 'House Comp',
                'amount' => $houseCompTotal,
            ]);
        }

        $unassignedPaymentAmount = Order::query()
            ->where('orders.status', OrderStatus::COMPLETED->value)
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->doesntHave('payments')
            ->sum('paid_amount');

        if ($unassignedPaymentAmount > 0) {
            $paymentBreakdown->push([
                'method' => 'Unassigned',
                'amount' => (float) $unassignedPaymentAmount,
            ]);
        }

        $submittedJournals = Schema::hasTable('finance_journals')
            ? DB::table('finance_journals')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'submitted')
                ->count()
            : 0;

        $submittedExpenses = Schema::hasTable('expenses') && Schema::hasColumn('expenses', 'approval_status')
            ? DB::table('expenses')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'submitted')
                ->count()
            : 0;

        $submittedCashMovements = Schema::hasTable('cash_movements')
            ? DB::table('cash_movements')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'submitted')
                ->count()
            : 0;

        $submittedPayrollRuns = Schema::hasTable('payroll_runs')
            ? DB::table('payroll_runs')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('status', 'submitted')
                ->count()
            : 0;

        $submittedEmployeeAdvances = Schema::hasTable('employee_advances')
            ? DB::table('employee_advances')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('status', 'submitted')
                ->count()
            : 0;

        $approvedJournalCount = Schema::hasTable('finance_journals')
            ? DB::table('finance_journals')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->whereIn('posting_status', ['posted', 'approved'])
                ->count()
            : 0;

        $draftJournalCount = Schema::hasTable('finance_journals')
            ? DB::table('finance_journals')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'draft')
                ->count()
            : 0;

        $approvedExpensesCount = Schema::hasTable('expenses') && Schema::hasColumn('expenses', 'approval_status')
            ? DB::table('expenses')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'approved')
                ->count()
            : 0;

        $draftExpensesCount = Schema::hasTable('expenses') && Schema::hasColumn('expenses', 'approval_status')
            ? DB::table('expenses')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'draft')
                ->count()
            : 0;

        $approvedCashMovementsCount = Schema::hasTable('cash_movements')
            ? DB::table('cash_movements')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'approved')
                ->count()
            : 0;

        $draftCashMovementsCount = Schema::hasTable('cash_movements')
            ? DB::table('cash_movements')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('approval_status', 'draft')
                ->count()
            : 0;

        $draftEmployeeAdvancesCount = Schema::hasTable('employee_advances')
            ? DB::table('employee_advances')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('status', 'draft')
                ->count()
            : 0;

        $completedSalesCount = $canUseProjectedFinanceData
            ? ($useProjectedFinanceData
                ? $this->branchDailyMetricReader->sumCompletedOrders($startDate, $endDate, $branchId)
                : Order::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->where('status', OrderStatus::COMPLETED->value)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count())
            : Order::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('status', OrderStatus::COMPLETED->value)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

        $ledgerStats = [
            'accounts' => Schema::hasTable('finance_accounts')
                ? DB::table('finance_accounts')->count()
                : 0,
            'journals' => $approvedJournalCount
                + $approvedExpensesCount
                + $approvedCashMovementsCount
                + $completedSalesCount,
            'draft_journals' => $draftJournalCount
                + $draftExpensesCount
                + $draftCashMovementsCount
                + $draftEmployeeAdvancesCount,
            'approval_queue' => $submittedJournals
                + $submittedExpenses
                + $submittedCashMovements
                + $submittedPayrollRuns
                + $submittedEmployeeAdvances,
        ];

        $generalLedger = $this->buildGeneralLedger(
            startDate: $startDate,
            endDate: $endDate,
            branchId: $branchId,
            paymentMethod: $paymentMethod,
            category: $category,
        );

        $modules = collect([
            [
                'name' => 'Chart of Accounts',
                'description' => 'Foundation for assets, liabilities, equity, revenue, COGS, and expenses.',
                'status' => Schema::hasTable('finance_accounts') ? 'Ready' : 'Pending migration',
            ],
            [
                'name' => 'General Ledger',
                'description' => 'Journal headers and lines for every approved financial event.',
                'status' => Schema::hasTable('finance_journal_lines') ? 'Ready' : 'Pending migration',
            ],
            [
                'name' => 'Expenses',
                'description' => 'Operational expenses with approval and account mapping support.',
                'status' => Schema::hasColumn('expenses', 'approval_status') ? 'Ready' : 'Needs upgrade',
            ],
            [
                'name' => 'Payroll',
                'description' => 'Payroll runs, payroll items, and unpaid salary visibility.',
                'status' => Schema::hasTable('payroll_run_items') ? 'Ready' : 'Pending migration',
            ],
            [
                'name' => 'Employee Advances',
                'description' => 'Employee takeouts and automatic payroll deductions.',
                'status' => Schema::hasTable('employee_advances') ? 'Ready' : 'Pending migration',
                'stats' => Schema::hasTable('employee_advances')
                    ? [
                        [
                            'label' => 'Total Advances',
                            'value' => (float) DB::table('employee_advances')
                                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                                ->sum('amount'),
                            'format' => 'currency',
                        ],
                        [
                            'label' => 'Outstanding',
                            'value' => (float) DB::table('employee_advances')
                                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                                ->sum('remaining_balance'),
                            'format' => 'currency',
                        ],
                        [
                            'label' => 'Submitted',
                            'value' => (int) DB::table('employee_advances')
                                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                                ->where('status', 'submitted')
                                ->count(),
                            'format' => 'number',
                        ],
                    ]
                    : [],
            ],
            [
                'name' => 'Cash & Bank',
                'description' => 'Manual cash movements, deposits, withdrawals, and branch petty cash.',
                'status' => Schema::hasTable('cash_movements') ? 'Ready' : 'Pending migration',
            ],
            [
                'name' => 'Inventory Valuation',
                'description' => 'Weighted average costing and inventory-to-COGS movement tracking.',
                'status' => Schema::hasColumn('inventory_transactions', 'weighted_average_cost_after') ? 'Ready' : 'Needs upgrade',
            ],
        ])->values();

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
            'expenseCategories' => $expenseCategoryOptions->values(),
            'projectionHealth' => $this->projectionHealthService->snapshot($useProjectedFinanceData),
            'dashboard' => [
                'summary' => [
                    'sales' => (float) $salesTotal,
                    'expenses' => (float) $expensesTotal,
                    'grossProfit' => $grossProfit,
                    'netProfit' => (float) $netProfit,
                    'cashPosition' => (float) $cashPosition,
                    'unpaidSalaries' => (float) $unpaidSalaries,
                    'inventoryValue' => (float) $inventoryValue,
                    'supplierBalances' => (float) $supplierBalances,
                    'employeeCoveredTotal' => (float) $employeeCoveredTotal,
                    'houseCompTotal' => (float) $houseCompTotal,
                ],
                'trend' => $trend,
                'branchRevenue' => $branchRevenue,
                'topExpenseCategories' => $topExpenseCategories,
                'paymentBreakdown' => $paymentBreakdown,
                'ledgerStats' => $ledgerStats,
                'generalLedger' => $generalLedger,
                'generalLedgerPreview' => $generalLedger->take(5)->values(),
                'modules' => $modules,
                'notes' => [
                    'grossProfit' => $grossProfit === null
                        ? 'Gross profit will become exact after inventory valuation and COGS posting are active.'
                        : 'Gross profit is using posted inventory cost movements.',
                    'cashPosition' => 'Cash position is a running balance from all-time cash sales (including legacy completed orders without payment rows), cash expenses, and approved cash movements. Date filters do not reduce this balance.',
                ],
            ],
        ]);
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

        $allEntries = $this->buildGeneralLedger(
            startDate: $startDate,
            endDate: $endDate,
            branchId: $branchId,
            paymentMethod: $paymentMethod,
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

    protected function salesQuery(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
        ?string $paymentMethod,
    ) {
        return Order::query()
            ->where('status', OrderStatus::COMPLETED->value)
            ->where(fn ($query) => $query->whereNull('covered_by_type')->orWhere('covered_by_type', '!=', 'house'))
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($paymentMethod, function ($query, $method) {
                $query->whereHas('payments', fn ($paymentQuery) => $paymentQuery->where('method', $method));
            })
            ->whereBetween('created_at', [$startDate, $endDate]);
    }

    protected function buildGeneralLedger(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId,
        ?string $paymentMethod,
        ?string $category,
        ?int $limit = 12,
    ) {
        $entries = collect();

        $salesEntries = Order::query()
            ->with(['branch:id,name'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($paymentMethod, function ($query, $method) {
                $query->whereHas('payments', fn ($paymentQuery) => $paymentQuery->where('method', $method));
            })
            ->where('status', OrderStatus::COMPLETED->value)
            ->where(fn ($query) => $query->whereNull('covered_by_type')->orWhere('covered_by_type', '!=', 'house'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderByDesc('created_at')
            ->when($limit, fn ($query) => $query->limit($limit))
            ->get()
            ->map(fn (Order $order) => [
                'date' => optional($order->created_at)?->toDateTimeString(),
                'reference' => 'Order #'.$order->id,
                'type' => 'Sale',
                'branch' => $order->branch?->name ?? 'All Branches',
                'account' => 'Food Sales',
                'description' => 'Completed '.$order->order_type?->value.' order',
                'debit' => 0.0,
                'credit' => (float) $order->total_amount,
                'status' => 'Posted',
            ]);

        $houseCompEntries = Order::query()
            ->with(['branch:id,name'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('status', OrderStatus::COMPLETED->value)
            ->where('covered_by_type', 'house')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderByDesc('created_at')
            ->when($limit, fn ($query) => $query->limit($limit))
            ->get()
            ->map(fn (Order $order) => [
                'date' => optional($order->created_at)?->toDateTimeString(),
                'reference' => 'Order #'.$order->id,
                'type' => 'House Comp',
                'branch' => $order->branch?->name ?? 'All Branches',
                'account' => 'Hospitality / Comp',
                'description' => $order->covered_by_note ?: 'Completed hospitality order',
                'debit' => (float) $order->total_amount,
                'credit' => 0.0,
                'status' => 'Posted',
            ]);

        $expenseEntries = Expense::query()
            ->with(['branch:id,name', 'expenseCategory:id,name', 'account:id,code,name'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($category, fn ($query) => $query->where('expense_category_id', $category))
            ->whereBetween('expense_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->when($limit, fn ($query) => $query->limit($limit))
            ->get()
            ->map(fn (Expense $expense) => [
                'date' => optional($expense->expense_date)?->toDateString(),
                'reference' => 'Expense #'.$expense->id,
                'type' => 'Expense',
                'branch' => $expense->branch?->name ?? 'All Branches',
                'account' => $expense->account?->name
                    ?? $expense->expenseCategory?->name
                    ?? 'Expense',
                'description' => $expense->title,
                'debit' => (float) $expense->amount,
                'credit' => 0.0,
                'status' => str($expense->approval_status ?? 'draft')->headline()->toString(),
            ]);

        $cashEntries = CashMovement::query()
            ->with(['branch:id,name', 'account:id,code,name', 'counterpartyAccount:id,code,name'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($paymentMethod, fn ($query, $method) => $query->where('payment_method', $method))
            ->whereBetween('movement_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->orderByDesc('movement_date')
            ->orderByDesc('id')
            ->when($limit, fn ($query) => $query->limit($limit))
            ->get()
            ->map(fn (CashMovement $movement) => [
                'date' => optional($movement->movement_date)?->toDateString(),
                'reference' => 'Movement #'.$movement->id,
                'type' => 'Cash Movement',
                'branch' => $movement->branch?->name ?? 'All Branches',
                'account' => $movement->account?->name ?? 'Cash / Bank',
                'description' => str($movement->movement_type)->replace('_', ' ')->title()->toString(),
                'debit' => $movement->direction === 'in' ? (float) $movement->amount : 0.0,
                'credit' => $movement->direction === 'out' ? (float) $movement->amount : 0.0,
                'status' => str($movement->approval_status ?? 'draft')->headline()->toString(),
            ]);

        $journalEntries = collect();
        if (Schema::hasTable('finance_journal_lines') && Schema::hasTable('finance_journals')) {
            $journalEntries = DB::table('finance_journal_lines')
                ->join('finance_journals', 'finance_journals.id', '=', 'finance_journal_lines.journal_id')
                ->leftJoin('branches', 'branches.id', '=', 'finance_journal_lines.branch_id')
                ->leftJoin('finance_accounts', 'finance_accounts.id', '=', 'finance_journal_lines.account_id')
                ->when($branchId, fn ($query) => $query->where('finance_journal_lines.branch_id', $branchId))
                ->whereBetween('finance_journals.journal_date', [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ])
                ->orderByDesc('finance_journals.journal_date')
                ->orderByDesc('finance_journal_lines.id')
                ->when($limit, fn ($query) => $query->limit($limit))
                ->get([
                    'finance_journals.id as journal_id',
                    'finance_journals.journal_date',
                    'finance_journals.reference_type',
                    'finance_journals.reference_id',
                    'finance_journals.approval_status',
                    'finance_journals.posting_status',
                    'branches.name as branch_name',
                    'finance_accounts.name as account_name',
                    'finance_journal_lines.debit',
                    'finance_journal_lines.credit',
                    'finance_journal_lines.memo',
                ])
                ->map(fn ($row) => [
                    'date' => $row->journal_date,
                    'reference' => 'Journal #'.$row->journal_id,
                    'type' => 'Journal Line',
                    'branch' => $row->branch_name ?? 'All Branches',
                    'account' => $row->account_name ?? 'Ledger Account',
                    'description' => $row->memo
                        ?? trim(($row->reference_type ?? 'journal').' #'.($row->reference_id ?? $row->journal_id)),
                    'debit' => (float) $row->debit,
                    'credit' => (float) $row->credit,
                    'status' => str($row->posting_status ?? $row->approval_status ?? 'draft')->headline()->toString(),
                ]);
        }

        $entries = $entries
            ->concat($journalEntries)
            ->concat($salesEntries)
            ->concat($expenseEntries)
            ->concat($cashEntries)
            ->sortByDesc('date')
            ->values();

        if ($limit) {
            return $entries->take($limit)->values();
        }

        return $entries;
    }
}
