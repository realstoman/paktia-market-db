<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PermissionEnum;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\EmployeeAdvance;
use App\Models\EmployeeContract;
use App\Models\EmployeeContractPaymentSchedule;
use App\Models\PayrollRun;
use App\Models\PayrollRunItem;
use App\Services\Finance\PayrollExpenseSyncService;
use App\Services\Projection\ProjectionDispatchService;
use App\Support\AfghanCalendar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function __construct(
        private readonly ProjectionDispatchService $projectionDispatchService,
        private readonly PayrollExpenseSyncService $payrollExpenseSyncService,
    ) {}

    public function index()
    {
        Gate::authorize(PermissionEnum::PAYROLL_VIEW->value);

        $runs = PayrollRun::query()
            ->with([
                'branch:id,name',
                'creator:id,name',
                'approver:id,name',
                'items.employee:id,first_name,last_name,branch_id',
            ])
            ->withCount('items')
            ->orderByDesc('period_end')
            ->orderByDesc('id')
            ->get()
            ->map(function (PayrollRun $run) {
                $gross = (float) $run->items->sum('gross_salary');
                $bonuses = (float) $run->items->sum('bonuses');
                $deductions = (float) $run->items->sum('deductions');
                $advances = (float) $run->items->sum('advances_deducted');
                $overtime = (float) $run->items->sum('overtime_amount');
                $net = (float) $run->items->sum('net_salary');

                return [
                    'id' => $run->id,
                    'branch_id' => $run->branch_id,
                    'branch' => $run->branch ? [
                        'id' => $run->branch->id,
                        'name' => $run->branch->name,
                    ] : null,
                    'period_start' => optional($run->period_start)->toDateString(),
                    'period_end' => optional($run->period_end)->toDateString(),
                    'status' => $run->status,
                    'notes' => $run->notes,
                    'created_at' => optional($run->created_at)->toISOString(),
                    'approved_at' => optional($run->approved_at)->toISOString(),
                    'paid_at' => optional($run->paid_at)->toISOString(),
                    'created_by' => $run->created_by,
                    'creator' => $run->creator ? [
                        'id' => $run->creator->id,
                        'name' => $run->creator->name,
                    ] : null,
                    'approved_by' => $run->approved_by,
                    'approver' => $run->approver ? [
                        'id' => $run->approver->id,
                        'name' => $run->approver->name,
                    ] : null,
                    'items_count' => $run->items_count,
                    'gross_total' => $gross,
                    'bonuses_total' => $bonuses,
                    'deductions_total' => $deductions,
                    'advances_total' => $advances,
                    'overtime_total' => $overtime,
                    'net_total' => $net,
                    'items' => $run->items->map(function (PayrollRunItem $item) {
                        $employeeName = $item->employee
                            ? trim(($item->employee->first_name ?? '').' '.($item->employee->last_name ?? ''))
                            : null;

                        return [
                            'id' => $item->id,
                            'employee_id' => $item->employee_id,
                            'employee_name' => $employeeName ?: 'Employee #'.$item->employee_id,
                            'employee' => $item->employee ? [
                                'id' => $item->employee->id,
                                'first_name' => $item->employee->first_name,
                                'last_name' => $item->employee->last_name,
                                'branch_id' => $item->employee->branch_id,
                            ] : null,
                            'salary_type' => $item->salary_type,
                            'gross_salary' => (float) $item->gross_salary,
                            'bonuses' => (float) $item->bonuses,
                            'deductions' => (float) $item->deductions,
                            'advances_deducted' => (float) $item->advances_deducted,
                            'overtime_amount' => (float) $item->overtime_amount,
                            'net_salary' => (float) $item->net_salary,
                            'payment_method' => $item->payment_method,
                            'payment_status' => $item->payment_status,
                            'payment_date' => optional($item->payment_date)->toDateString(),
                            'covered_period_dates' => collect($item->covered_period_dates ?? [])
                                ->filter()
                                ->values()
                                ->all(),
                            'covered_month_count' => (int) ($item->covered_month_count ?: 1),
                        ];
                    })->values(),
                ];
            })
            ->values();

        $activeEmployees = Employee::query()
            ->with('branch:id,name')
            ->where('is_active', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'branch_id', 'salary', 'contract_amount', 'salary_currency']);

        $outstandingAdvances = EmployeeAdvance::query()
            ->where('status', 'approved')
            ->where('remaining_balance', '>', 0)
            ->sum('remaining_balance');

        $upcomingContractPayments = Schema::hasTable('employee_contracts') && Schema::hasTable('employee_contract_payment_schedules')
            ? (float) EmployeeContractPaymentSchedule::query()
                ->whereHas('contract', fn ($query) => $query->whereIn('status', ['submitted', 'approved', 'active']))
                ->whereDate('due_date', '>=', now()->toDateString())
                ->whereIn('status', ['submitted', 'approved'])
                ->whereIn('id', function ($query) {
                    $query->selectRaw('MIN(employee_contract_payment_schedules.id)')
                        ->from('employee_contract_payment_schedules')
                        ->join('employee_contracts', 'employee_contracts.id', '=', 'employee_contract_payment_schedules.employee_contract_id')
                        ->whereIn('employee_contracts.status', ['submitted', 'approved', 'active'])
                        ->whereDate('employee_contract_payment_schedules.due_date', '>=', now()->toDateString())
                        ->whereIn('employee_contract_payment_schedules.status', ['submitted', 'approved'])
                        ->groupBy('employee_contract_payment_schedules.employee_contract_id');
                })
                ->sum('amount')
            : 0.0;

        $summary = [
            'activeEmployees' => $activeEmployees
                ->filter(fn (Employee $employee) => $this->resolveBaseSalary($employee) > 0)
                ->count(),
            'draftRuns' => $runs->where('status', 'draft')->count(),
            'submittedRuns' => $runs->where('status', 'submitted')->count(),
            'unpaidPayroll' => (float) $runs->sum(function (array $run) {
                return collect($run['items'])
                    ->where('payment_status', '!=', 'paid')
                    ->sum('net_salary');
            }) + $upcomingContractPayments,
            'paidThisMonth' => (float) $runs
                ->filter(fn (array $run) => ($run['paid_at'] ?? null) && str_starts_with($run['paid_at'], now()->format('Y-m')))
                ->sum('net_total'),
            'outstandingAdvances' => (float) $outstandingAdvances,
        ];

        $contracts = Schema::hasTable('employee_contracts') && Schema::hasTable('employee_contract_payment_schedules')
            ? EmployeeContract::query()
                ->with([
                    'employee:id,first_name,last_name,branch_id',
                    'branch:id,name',
                    'schedules',
                ])
                ->orderByDesc('id')
                ->get()
                ->map(function (EmployeeContract $contract) {
                    $scheduledTotal = (float) $contract->schedules->sum('amount');
                    $paidTotal = (float) $contract->schedules->where('status', 'paid')->sum('amount');

                    return [
                        'id' => $contract->id,
                        'employee_id' => $contract->employee_id,
                        'employee' => $contract->employee ? [
                            'id' => $contract->employee->id,
                            'first_name' => $contract->employee->first_name,
                            'last_name' => $contract->employee->last_name,
                            'branch_id' => $contract->employee->branch_id,
                        ] : null,
                        'branch_id' => $contract->branch_id,
                        'branch' => $contract->branch ? [
                            'id' => $contract->branch->id,
                            'name' => $contract->branch->name,
                        ] : null,
                        'contract_amount' => (float) $contract->contract_amount,
                        'start_date' => optional($contract->start_date)->toDateString(),
                        'end_date' => optional($contract->end_date)->toDateString(),
                        'payment_plan_type' => $contract->payment_plan_type,
                        'installment_count' => $contract->installment_count,
                        'status' => $contract->status,
                        'notes' => $contract->notes,
                        'scheduled_total' => $scheduledTotal,
                        'paid_total' => $paidTotal,
                        'unpaid_total' => max(0, $scheduledTotal - $paidTotal),
                        'schedules' => $contract->schedules->map(function (EmployeeContractPaymentSchedule $schedule) use ($contract) {
                            return [
                                'id' => $schedule->id,
                                'employee_contract_id' => $schedule->employee_contract_id,
                                'contract' => [
                                    'id' => $contract->id,
                                    'employee_id' => $contract->employee_id,
                                    'contract_amount' => (float) $contract->contract_amount,
                                    'payment_plan_type' => $contract->payment_plan_type,
                                    'status' => $contract->status,
                                ],
                                'due_date' => optional($schedule->due_date)->toDateString(),
                                'title' => $schedule->title,
                                'percentage' => $schedule->percentage !== null ? (float) $schedule->percentage : null,
                                'amount' => (float) $schedule->amount,
                                'status' => $schedule->status,
                                'payment_method' => $schedule->payment_method,
                                'attachment_path' => $schedule->attachment_path,
                                'paid_at' => optional($schedule->paid_at)->toISOString(),
                                'notes' => $schedule->notes,
                            ];
                        })->values(),
                    ];
                })
                ->values()
            : collect();

        return Inertia::render('finance/payroll/index', [
            'runs' => $runs,
            'contracts' => $contracts,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name', 'address']),
            'employees' => $activeEmployees,
            'afghanPayrollMonths' => AfghanCalendar::payrollMonthOptions(),
            'currentAfghanPayrollMonth' => AfghanCalendar::currentMonth(),
            'summary' => $summary,
            'canCreate' => Gate::allows(PermissionEnum::PAYROLL_CREATE->value),
            'canApprove' => Gate::allows(PermissionEnum::PAYROLL_APPROVE->value),
            'canPay' => Gate::allows(PermissionEnum::PAYROLL_PAY->value),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize(PermissionEnum::PAYROLL_CREATE->value);

        $validated = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'afghan_year' => ['nullable', 'integer', 'min:1300', 'max:1600'],
            'afghan_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'period_start' => ['required_without:afghan_month', 'date_format:Y-m-d'],
            'period_end' => ['required_without:afghan_month', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'status' => ['nullable', 'in:draft,submitted'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $status = $validated['status'] ?? 'draft';
        $payrollMonth = isset($validated['afghan_year'], $validated['afghan_month'])
            ? AfghanCalendar::monthRange((int) $validated['afghan_year'], (int) $validated['afghan_month'])
            : AfghanCalendar::monthForDate($validated['period_end'] ?? null);
        $periodStart = $payrollMonth['start'];
        $periodEnd = $payrollMonth['end'];

        $employees = Employee::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('is_active', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'branch_id', 'salary', 'contract_amount']);

        $payableEmployees = $employees
            ->map(function (Employee $employee) {
                $baseSalary = $this->resolveBaseSalary($employee);

                return [
                    'employee' => $employee,
                    'base_salary' => $baseSalary,
                ];
            })
            ->filter(fn (array $row) => $row['base_salary'] > 0)
            ->values();

        if ($payableEmployees->isEmpty()) {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['payroll' => 'No active employees with salary or contract amount were found for this payroll run.']);
        }

        $alreadyExists = PayrollRun::query()
            ->where('period_start', $periodStart)
            ->where('period_end', $periodEnd)
            ->when(
                $branchId,
                fn ($query) => $query->where('branch_id', $branchId),
                fn ($query) => $query->whereNull('branch_id'),
            )
            ->exists();

        if ($alreadyExists) {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['payroll' => 'A payroll run for '.$payrollMonth['label'].' already exists.']);
        }

        DB::transaction(function () use ($branchId, $payableEmployees, $payrollMonth, $periodEnd, $periodStart, $request, $status, $validated) {
            $run = PayrollRun::create([
                'branch_id' => $branchId,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'status' => $status,
                'created_by' => $request->user()?->id,
                'notes' => trim(($validated['notes'] ?? '')."\n".$payrollMonth['label']) ?: null,
            ]);

            foreach ($payableEmployees as $row) {
                /** @var Employee $employee */
                $employee = $row['employee'];
                $salaryType = ! empty($employee->salary) ? 'fixed_salary' : 'contract_payment';
                $coveredPeriods = $salaryType === 'fixed_salary'
                    ? $this->resolveFixedSalaryPeriods(
                        employee: $employee,
                        periodStart: Carbon::parse($periodStart),
                        periodEnd: Carbon::parse($periodEnd),
                        branchId: $branchId,
                    )
                    : [];

                $grossSalary = $salaryType === 'fixed_salary'
                    ? (float) $row['base_salary'] * max(1, count($coveredPeriods))
                    : (Schema::hasTable('employee_contract_payment_schedules') && Schema::hasTable('employee_contracts')
                        ? (float) EmployeeContractPaymentSchedule::query()
                            ->whereHas('contract', function ($query) use ($employee, $branchId) {
                                $query->where('employee_id', $employee->id)
                                    ->when($branchId, fn ($contractQuery) => $contractQuery->where('branch_id', $branchId))
                                    ->whereIn('status', ['submitted', 'approved', 'active']);
                            })
                            ->whereBetween('due_date', [
                                $periodStart,
                                $periodEnd,
                            ])
                            ->whereIn('status', ['submitted', 'approved'])
                            ->sum('amount')
                        : 0.0);

                if ($salaryType === 'fixed_salary' && count($coveredPeriods) === 0) {
                    continue;
                }

                if ($grossSalary <= 0) {
                    continue;
                }

                $outstandingAdvance = (float) EmployeeAdvance::query()
                    ->where('employee_id', $employee->id)
                    ->where('status', 'approved')
                    ->where('remaining_balance', '>', 0)
                    ->sum('remaining_balance');

                $advanceDeduction = min($grossSalary, $outstandingAdvance);
                $netSalary = max(0, $grossSalary - $advanceDeduction);

                PayrollRunItem::create([
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                    'salary_type' => $salaryType,
                    'gross_salary' => $grossSalary,
                    'bonuses' => 0,
                    'deductions' => 0,
                    'advances_deducted' => $advanceDeduction,
                    'overtime_amount' => 0,
                    'net_salary' => $netSalary,
                    'payment_method' => $validated['payment_method'] ?? PaymentMethod::CASH->value,
                    'payment_status' => 'unpaid',
                    'payment_date' => null,
                    'covered_period_dates' => $coveredPeriods,
                    'covered_month_count' => $salaryType === 'fixed_salary'
                        ? max(1, count($coveredPeriods))
                        : 1,
                ]);
            }
        });

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Payroll run generated successfully.');
    }

    public function approve(Request $request, PayrollRun $payrollRun)
    {
        Gate::authorize(PermissionEnum::PAYROLL_APPROVE->value);

        if ($payrollRun->status === 'paid') {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['payroll' => 'A paid payroll run cannot be approved again.']);
        }

        $payrollRun->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Payroll run approved successfully.');
    }

    public function reject(PayrollRun $payrollRun)
    {
        Gate::authorize(PermissionEnum::PAYROLL_APPROVE->value);

        if ($payrollRun->status === 'paid') {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['payroll' => 'A paid payroll run cannot be sent back to draft.']);
        }

        $payrollRun->update([
            'status' => 'draft',
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Payroll run moved back to draft.');
    }

    public function markPaid(PayrollRun $payrollRun)
    {
        Gate::authorize(PermissionEnum::PAYROLL_PAY->value);

        if ($payrollRun->status !== 'approved') {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['payroll' => 'Only approved payroll runs can be marked as paid.']);
        }

        DB::transaction(function () use ($payrollRun) {
            $payrollRun->load('items');

            foreach ($payrollRun->items as $item) {
                $remainingToApply = (float) $item->advances_deducted;

                if ($remainingToApply > 0) {
                    $advances = EmployeeAdvance::query()
                        ->where('employee_id', $item->employee_id)
                        ->where('status', 'approved')
                        ->where('remaining_balance', '>', 0)
                        ->orderBy('advance_date')
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get();

                    foreach ($advances as $advance) {
                        if ($remainingToApply <= 0) {
                            break;
                        }

                        $available = (float) $advance->remaining_balance;
                        if ($available <= 0) {
                            continue;
                        }

                        $applied = min($available, $remainingToApply);

                        $advance->update([
                            'deducted_amount' => (float) $advance->deducted_amount + $applied,
                            'remaining_balance' => max(0, $available - $applied),
                        ]);

                        $remainingToApply -= $applied;
                    }
                }

                if ($item->salary_type === 'contract_payment' && Schema::hasTable('employee_contract_payment_schedules')) {
                    EmployeeContractPaymentSchedule::query()
                        ->whereHas('contract', function ($query) use ($item, $payrollRun) {
                            $query->where('employee_id', $item->employee_id)
                                ->when(
                                    $payrollRun->branch_id,
                                    fn ($contractQuery) => $contractQuery->where('branch_id', $payrollRun->branch_id),
                                );
                        })
                        ->whereBetween('due_date', [
                            $payrollRun->period_start->toDateString(),
                            $payrollRun->period_end->toDateString(),
                        ])
                        ->whereIn('status', ['submitted', 'approved'])
                        ->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                        ]);
                }

                $item->update([
                    'payment_status' => 'paid',
                    'payment_date' => now()->toDateString(),
                ]);

                $this->payrollExpenseSyncService->syncPaidItem(
                    $payrollRun,
                    $item,
                );
            }

            $payrollRun->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        });

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Payroll run marked as paid.')
            ->with('notification', [
                'id' => 'payroll-paid-'.$payrollRun->id.'-'.now()->timestamp,
                'category' => 'salary',
                'title' => 'Payroll paid',
                'description' => 'Payroll run #'.$payrollRun->id.' was marked as paid.',
                'href' => '/finance/payroll',
                'priority' => 'high',
                'meta' => 'Net payroll • '.number_format((float) $payrollRun->items->sum('net_salary'), 0).' ؋',
            ]);
    }

    /**
     * @return array<int, string>
     */
    private function resolveFixedSalaryPeriods(
        Employee $employee,
        Carbon $periodStart,
        Carbon $periodEnd,
        ?int $branchId,
    ): array {
        $anchorDay = $periodEnd->day;
        $periodEndAnchor = $periodEnd->copy()->startOfDay();
        $employmentStart = $employee->contract_start_date
            ? Carbon::parse($employee->contract_start_date)->startOfDay()
            : $periodStart->copy()->startOfDay();

        $startAnchor = $this->alignAnchorDate($employmentStart, $anchorDay);

        if ($startAnchor->gt($periodEndAnchor)) {
            return [];
        }

        $existingAnchors = PayrollRunItem::query()
            ->where('employee_id', $employee->id)
            ->where('salary_type', 'fixed_salary')
            ->when(
                $branchId,
                fn ($query) => $query->whereHas('payrollRun', fn ($runQuery) => $runQuery->where('branch_id', $branchId)),
            )
            ->get(['covered_period_dates', 'payment_date'])
            ->flatMap(function (PayrollRunItem $item) {
                $covered = collect($item->covered_period_dates ?? [])->filter()->values();

                if ($covered->isNotEmpty()) {
                    return $covered;
                }

                return $item->payment_date ? [$item->payment_date->toDateString()] : [];
            })
            ->filter()
            ->values()
            ->all();

        $reserved = collect($existingAnchors)
            ->map(fn ($value) => Carbon::parse($value)->toDateString())
            ->unique()
            ->all();

        $periods = [];
        $cursor = $startAnchor->copy();

        while ($cursor->lte($periodEndAnchor)) {
            $bucket = $cursor->toDateString();

            if (! in_array($bucket, $reserved, true)) {
                $periods[] = $bucket;
            }

            $cursor->addMonthNoOverflow();
        }

        return $periods;
    }

    private function alignAnchorDate(Carbon $date, int $anchorDay): Carbon
    {
        $anchor = $date->copy()->day(min($anchorDay, $date->copy()->endOfMonth()->day));

        if ($anchor->lt($date)) {
            $anchor = $anchor->addMonthNoOverflow()
                ->day(min($anchorDay, $anchor->copy()->endOfMonth()->day));
        }

        return $anchor->startOfDay();
    }

    public function storeContract(Request $request)
    {
        Gate::authorize(PermissionEnum::PAYROLL_CREATE->value);

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'contract_amount' => ['required', 'numeric', 'min:1'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'payment_plan_type' => ['required', 'in:equal_installments,custom_schedule,manual_milestones'],
            'installment_count' => ['nullable', 'integer', 'min:1'],
            'milestone_percentages' => ['nullable', 'array', 'min:1'],
            'milestone_percentages.*' => ['numeric', 'gt:0', 'lte:100'],
            'status' => ['nullable', 'in:draft,submitted,approved,active'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $milestonePercentages = collect($validated['milestone_percentages'] ?? [])
            ->map(fn ($value) => round((float) $value, 2))
            ->filter(fn (float $value) => $value > 0)
            ->values();

        if (
            in_array($validated['payment_plan_type'], ['custom_schedule', 'manual_milestones'], true)
            && $milestonePercentages->isNotEmpty()
            && round($milestonePercentages->sum(), 2) !== 100.0
        ) {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['contract' => 'Milestone percentages must add up to 100.']);
        }

        DB::transaction(function () use ($milestonePercentages, $validated) {
            $derivedInstallmentCount = $milestonePercentages->isNotEmpty()
                ? $milestonePercentages->count()
                : null;

            $contract = EmployeeContract::create([
                'employee_id' => $validated['employee_id'],
                'branch_id' => $validated['branch_id'] ?? null,
                'contract_amount' => $validated['contract_amount'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'payment_plan_type' => $validated['payment_plan_type'],
                'installment_count' => $validated['installment_count'] ?? $derivedInstallmentCount,
                'status' => $validated['status'] ?? 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            if (
                $contract->payment_plan_type === 'equal_installments'
                && $contract->installment_count
                && $contract->installment_count > 0
            ) {
                $baseAmount = round((float) $contract->contract_amount / $contract->installment_count, 2);
                $remaining = (float) $contract->contract_amount;
                $startDate = Carbon::parse($contract->start_date);

                for ($index = 0; $index < $contract->installment_count; $index++) {
                    $amount = $index === ($contract->installment_count - 1)
                        ? $remaining
                        : $baseAmount;
                    $remaining -= $amount;

                    EmployeeContractPaymentSchedule::create([
                        'employee_contract_id' => $contract->id,
                        'due_date' => $startDate->copy()->addMonths($index)->toDateString(),
                        'title' => 'Installment '.($index + 1),
                        'percentage' => round(100 / $contract->installment_count, 2),
                        'amount' => $amount,
                        'status' => in_array($contract->status, ['approved', 'active'], true) ? 'approved' : 'draft',
                        'payment_method' => PaymentMethod::BANK_TRANSFER->value,
                        'notes' => null,
                    ]);
                }
            } elseif (
                in_array($contract->payment_plan_type, ['custom_schedule', 'manual_milestones'], true)
                && $milestonePercentages->isNotEmpty()
            ) {
                $remaining = (float) $contract->contract_amount;
                $startDate = Carbon::parse($contract->start_date);
                $count = $milestonePercentages->count();

                foreach ($milestonePercentages as $index => $percentage) {
                    $amount = $index === ($count - 1)
                        ? $remaining
                        : round(((float) $contract->contract_amount * $percentage) / 100, 2);
                    $remaining -= $amount;

                    EmployeeContractPaymentSchedule::create([
                        'employee_contract_id' => $contract->id,
                        'due_date' => $startDate->copy()->addMonths($index)->toDateString(),
                        'title' => 'Milestone '.($index + 1),
                        'percentage' => $percentage,
                        'amount' => $amount,
                        'status' => in_array($contract->status, ['approved', 'active'], true) ? 'approved' : 'draft',
                        'payment_method' => PaymentMethod::BANK_TRANSFER->value,
                        'notes' => null,
                    ]);
                }
            }
        });

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment plan created successfully.');
    }

    public function updateContract(Request $request, EmployeeContract $contract)
    {
        Gate::authorize(PermissionEnum::PAYROLL_CREATE->value);

        if (($contract->schedules()->where('status', 'paid')->count()) > 0) {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['contract' => 'A contract plan with paid schedules cannot be edited.']);
        }

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'contract_amount' => ['required', 'numeric', 'min:1'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'payment_plan_type' => ['required', 'in:equal_installments,custom_schedule,manual_milestones'],
            'installment_count' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'in:draft,submitted,approved,active'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $contract->update([
            'employee_id' => $validated['employee_id'],
            'branch_id' => $validated['branch_id'] ?? null,
            'contract_amount' => $validated['contract_amount'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'payment_plan_type' => $validated['payment_plan_type'],
            'installment_count' => $validated['installment_count'] ?? null,
            'status' => $validated['status'] ?? $contract->status,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment plan updated successfully.');
    }

    public function destroyContract(EmployeeContract $contract)
    {
        Gate::authorize(PermissionEnum::PAYROLL_CREATE->value);

        if (($contract->schedules()->where('status', 'paid')->count()) > 0) {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['contract' => 'A contract plan with paid schedules cannot be deleted.']);
        }

        $contract->schedules
            ->pluck('attachment_path')
            ->filter()
            ->each(fn (string $path) => Storage::disk('public')->delete($path));

        $contract->delete();

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment plan deleted successfully.');
    }

    public function approveSchedule(EmployeeContractPaymentSchedule $schedule)
    {
        Gate::authorize(PermissionEnum::PAYROLL_APPROVE->value);

        if ($schedule->status === 'paid') {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['schedule' => 'A paid contract schedule cannot be approved again.']);
        }

        $schedule->update([
            'status' => 'approved',
        ]);

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment schedule approved successfully.');
    }

    public function rejectSchedule(EmployeeContractPaymentSchedule $schedule)
    {
        Gate::authorize(PermissionEnum::PAYROLL_APPROVE->value);

        if ($schedule->status === 'paid') {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['schedule' => 'A paid contract schedule cannot be moved back to draft.']);
        }

        $schedule->update([
            'status' => 'draft',
        ]);

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment schedule moved back to draft.');
    }

    public function storeSchedule(Request $request)
    {
        Gate::authorize(PermissionEnum::PAYROLL_CREATE->value);

        $validated = $request->validate([
            'employee_contract_id' => ['required', 'exists:employee_contracts,id'],
            'due_date' => ['required', 'date_format:Y-m-d'],
            'title' => ['nullable', 'string', 'max:255'],
            'percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'amount' => ['required', 'numeric', 'min:1'],
            'status' => ['nullable', 'in:draft,submitted,approved,paid'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $attachmentPath = $request->hasFile('receipt')
            ? $request->file('receipt')->store('contract-schedule-attachments', 'public')
            : null;

        EmployeeContractPaymentSchedule::create([
            'employee_contract_id' => $validated['employee_contract_id'],
            'due_date' => $validated['due_date'],
            'title' => $validated['title'] ?? null,
            'percentage' => $validated['percentage'] ?? null,
            'amount' => $validated['amount'],
            'status' => $validated['status'] ?? 'draft',
            'payment_method' => $validated['payment_method'] ?? PaymentMethod::BANK_TRANSFER->value,
            'attachment_path' => $attachmentPath,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment schedule created successfully.');
    }

    public function updateSchedule(Request $request, EmployeeContractPaymentSchedule $schedule)
    {
        Gate::authorize(PermissionEnum::PAYROLL_CREATE->value);

        if ($schedule->status === 'paid') {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['schedule' => 'A paid contract schedule cannot be edited.']);
        }

        $validated = $request->validate([
            'employee_contract_id' => ['required', 'exists:employee_contracts,id'],
            'due_date' => ['required', 'date_format:Y-m-d'],
            'title' => ['nullable', 'string', 'max:255'],
            'percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'amount' => ['required', 'numeric', 'min:1'],
            'status' => ['nullable', 'in:draft,submitted,approved,paid'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $attachmentPath = $schedule->attachment_path;
        if ($request->hasFile('receipt')) {
            if ($attachmentPath) {
                Storage::disk('public')->delete($attachmentPath);
            }

            $attachmentPath = $request->file('receipt')->store('contract-schedule-attachments', 'public');
        }

        $schedule->update([
            'employee_contract_id' => $validated['employee_contract_id'],
            'due_date' => $validated['due_date'],
            'title' => $validated['title'] ?? null,
            'percentage' => $validated['percentage'] ?? null,
            'amount' => $validated['amount'],
            'status' => $validated['status'] ?? $schedule->status,
            'payment_method' => $validated['payment_method'] ?? $schedule->payment_method,
            'attachment_path' => $attachmentPath,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment schedule updated successfully.');
    }

    public function destroySchedule(EmployeeContractPaymentSchedule $schedule)
    {
        Gate::authorize(PermissionEnum::PAYROLL_CREATE->value);

        if ($schedule->status === 'paid') {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['schedule' => 'A paid contract schedule cannot be deleted.']);
        }

        if ($schedule->attachment_path) {
            Storage::disk('public')->delete($schedule->attachment_path);
        }

        $schedule->delete();

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Contract payment schedule deleted successfully.');
    }

    protected function resolveBaseSalary(Employee $employee): float
    {
        $salary = (float) ($employee->salary ?? 0);
        $contractAmount = (float) ($employee->contract_amount ?? 0);

        return $salary > 0 ? $salary : $contractAmount;
    }
}
