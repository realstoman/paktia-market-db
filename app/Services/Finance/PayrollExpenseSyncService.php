<?php

namespace App\Services\Finance;

use App\Enums\PaymentMethod;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinanceAccount;
use App\Models\PayrollRun;
use App\Models\PayrollRunItem;
use App\Support\AfghanCalendar;

class PayrollExpenseSyncService
{
    public function syncPaidRun(PayrollRun $run): void
    {
        $run->loadMissing('items.employee');

        foreach ($run->items->where('payment_status', 'paid') as $item) {
            $this->syncPaidItem($run, $item);
        }
    }

    public function syncMissingPaidItems(): void
    {
        $items = PayrollRunItem::query()
            ->with(['employee', 'payrollRun'])
            ->where('payment_status', 'paid')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        foreach ($items as $item) {
            if (! $item->payrollRun) {
                continue;
            }

            $this->syncPaidItem($item->payrollRun, $item);
        }
    }

    public function syncPaidItem(PayrollRun $run, PayrollRunItem $item): void
    {
        $employee = $item->employee instanceof Employee
            ? $item->employee
            : $item->employee()->first();

        $branchId = $run->branch_id ?? $employee?->branch_id;

        if (! $branchId) {
            return;
        }

        $salaryCategory = ExpenseCategory::query()
            ->where('slug', 'salary')
            ->first();

        $expenseAccountId = $salaryCategory?->expense_account_id
            ?: FinanceAccount::query()
                ->where('status', 'active')
                ->where('type', 'expense')
                ->where(function ($query) {
                    $query->where('code', '6000')
                        ->orWhereRaw('LOWER(name) LIKE ?', ['%salar%']);
                })
                ->value('id');

        $employeeName = $employee
            ? trim(($employee->first_name ?? '').' '.($employee->last_name ?? ''))
            : 'Employee #'.$item->employee_id;

        $periodDates = collect($item->covered_period_dates ?? [])
            ->filter()
            ->values();

        $periodLabel = $periodDates->isNotEmpty()
            ? $periodDates
                ->map(fn ($date) => AfghanCalendar::formatMonthLabel($date))
                ->join(', ')
            : AfghanCalendar::formatMonthLabel($run->period_end);

        $paymentDate = $item->payment_date?->toDateString() ?? now()->toDateString();
        $title = "Salary payment for {$employeeName} • Payroll item #{$item->id}";

        $expense = Expense::query()->updateOrCreate(
            [
                'branch_id' => $branchId,
                'title' => $title,
            ],
            [
                'vendor_id' => null,
                'expense_type' => 'salary',
                'expense_category_id' => $salaryCategory?->id,
                'account_id' => $expenseAccountId,
                'paid_from_account_id' => null,
                'amount' => (float) $item->net_salary,
                'payment_method' => $item->payment_method ?: PaymentMethod::CASH->value,
                'description' => "Payroll run #{$run->id} • Payroll item #{$item->id} • Payment for month {$periodLabel}",
                'attachments' => null,
                'expense_date' => $paymentDate,
                'approval_status' => 'approved',
                'created_by' => $run->created_by,
                'approved_by' => $run->approved_by,
                'approved_at' => $run->paid_at ?? now(),
            ],
        );

    }
}
