<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PermissionEnum;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\EmployeeAdvance;
use App\Models\PayrollRun;
use App\Models\PayrollRunItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PayrollController extends Controller
{
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
                        return [
                            'id' => $item->id,
                            'employee_id' => $item->employee_id,
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
            }),
            'paidThisMonth' => (float) $runs
                ->filter(fn (array $run) => ($run['paid_at'] ?? null) && str_starts_with($run['paid_at'], now()->format('Y-m')))
                ->sum('net_total'),
            'outstandingAdvances' => (float) $outstandingAdvances,
        ];

        return Inertia::render('finance/payroll/index', [
            'runs' => $runs,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'employees' => $activeEmployees,
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
            'period_start' => ['required', 'date_format:Y-m-d'],
            'period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'status' => ['nullable', 'in:draft,submitted'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $status = $validated['status'] ?? 'draft';

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
            ->where('period_start', $validated['period_start'])
            ->where('period_end', $validated['period_end'])
            ->when(
                $branchId,
                fn ($query) => $query->where('branch_id', $branchId),
                fn ($query) => $query->whereNull('branch_id'),
            )
            ->exists();

        if ($alreadyExists) {
            return redirect()
                ->route('finance.payroll.index')
                ->withErrors(['payroll' => 'A payroll run for this branch and period already exists.']);
        }

        DB::transaction(function () use ($branchId, $payableEmployees, $request, $status, $validated) {
            $run = PayrollRun::create([
                'branch_id' => $branchId,
                'period_start' => $validated['period_start'],
                'period_end' => $validated['period_end'],
                'status' => $status,
                'created_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($payableEmployees as $row) {
                /** @var Employee $employee */
                $employee = $row['employee'];
                $grossSalary = (float) $row['base_salary'];
                $salaryType = ! empty($employee->salary) ? 'fixed_salary' : 'contract_payment';
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

                $item->update([
                    'payment_status' => 'paid',
                    'payment_date' => now()->toDateString(),
                ]);
            }

            $payrollRun->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        });

        return redirect()
            ->route('finance.payroll.index')
            ->with('success', 'Payroll run marked as paid.');
    }

    protected function resolveBaseSalary(Employee $employee): float
    {
        $salary = (float) ($employee->salary ?? 0);
        $contractAmount = (float) ($employee->contract_amount ?? 0);

        return $salary > 0 ? $salary : $contractAmount;
    }
}
