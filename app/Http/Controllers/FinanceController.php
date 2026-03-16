<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Order;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
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

        $salesTotal = $this->salesQuery($startDate, $endDate, $branchId, $paymentMethod)
            ->sum('total_amount');

        $expensesTotal = Expense::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($category, fn ($query) => $query->where('expense_category_id', $category))
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

        $cashSales = Schema::hasTable('payments')
            ? (float) DB::table('payments')
                ->join('orders', 'orders.id', '=', 'payments.order_id')
                ->where('orders.status', OrderStatus::COMPLETED->value)
                ->where('payments.method', 'cash')
                ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->sum('payments.amount')
            : 0.0;

        $cashExpenses = Schema::hasColumn('expenses', 'payment_method')
            ? (float) DB::table('expenses')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->where('payment_method', 'cash')
                ->whereBetween('expense_date', [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ])
                ->sum('amount')
            : 0.0;

        $cashMovementsNet = Schema::hasTable('cash_movements')
            ? (float) DB::table('cash_movements')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->whereBetween('movement_date', [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ])
                ->where('approval_status', 'approved')
                ->selectRaw(
                    "COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total"
                )
                ->value('total')
            : 0.0;

        $cashPosition = $cashSales - $cashExpenses + $cashMovementsNet;

        $unpaidSalaries = Schema::hasTable('payroll_run_items') && Schema::hasTable('payroll_runs')
            ? (float) DB::table('payroll_run_items')
                ->join('payroll_runs', 'payroll_runs.id', '=', 'payroll_run_items.payroll_run_id')
                ->when($branchId, fn ($query) => $query->where('payroll_runs.branch_id', $branchId))
                ->where('payroll_run_items.payment_status', '!=', 'paid')
                ->whereDate('payroll_runs.period_end', '<=', $endDate->toDateString())
                ->sum('payroll_run_items.net_salary')
            : 0.0;

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

        $salesTrend = $this->salesQuery($startDate, $endDate, $branchId, $paymentMethod)
            ->selectRaw('DATE(created_at) as bucket, COALESCE(SUM(total_amount), 0) as total')
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        $expenseTrend = Expense::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($category, fn ($query) => $query->where('expense_category_id', $category))
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
                ->selectRaw('COALESCE(SUM(payments.amount), 0) as total')
                ->groupBy('payments.method')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => [
                    'method' => str($row->method)->replace('_', ' ')->title()->toString(),
                    'amount' => (float) $row->total,
                ])
                ->values()
            : collect();

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

        $ledgerStats = [
            'accounts' => Schema::hasTable('finance_accounts')
                ? DB::table('finance_accounts')->count()
                : 0,
            'journals' => Schema::hasTable('finance_journals')
                ? DB::table('finance_journals')->count()
                : 0,
            'draft_journals' => Schema::hasTable('finance_journals')
                ? DB::table('finance_journals')->where('posting_status', 'draft')->count()
                : 0,
            'approval_queue' => $submittedJournals
                + $submittedExpenses
                + $submittedCashMovements
                + $submittedPayrollRuns,
        ];

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
                ],
                'trend' => $trend,
                'branchRevenue' => $branchRevenue,
                'topExpenseCategories' => $topExpenseCategories,
                'paymentBreakdown' => $paymentBreakdown,
                'ledgerStats' => $ledgerStats,
                'modules' => $modules,
                'notes' => [
                    'grossProfit' => $grossProfit === null
                        ? 'Gross profit will become exact after inventory valuation and COGS posting are active.'
                        : 'Gross profit is using posted inventory cost movements.',
                    'cashPosition' => 'Cash position is based on recorded cash sales, cash expenses, and approved cash movements within the selected period.',
                ],
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
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($paymentMethod, function ($query, $method) {
                $query->whereHas('payments', fn ($paymentQuery) => $paymentQuery->where('method', $method));
            })
            ->whereBetween('created_at', [$startDate, $endDate]);
    }
}
