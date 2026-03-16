<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinanceAccount;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index()
    {
        return Inertia::render('finance/expenses/index', [
            'expenses' => Expense::query()
                ->with([
                    'branch:id,name',
                    'vendor:id,name',
                    'expenseCategory:id,name,expense_account_id',
                    'account:id,code,name',
                    'paidFromAccount:id,code,name',
                    'creator:id,name',
                    'approver:id,name',
                ])
                ->orderByDesc('expense_date')
                ->orderByDesc('id')
                ->get(),
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'expenseCategories' => ExpenseCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'expense_account_id']),
            'vendors' => Vendor::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'ledgerAccounts' => FinanceAccount::query()
                ->where('status', 'active')
                ->where('is_postable', true)
                ->whereIn('type', ['expense', 'cogs'])
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'type']),
            'paidFromAccounts' => FinanceAccount::query()
                ->where('status', 'active')
                ->where('is_postable', true)
                ->where('type', 'asset')
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateExpense($request);
        $category = ExpenseCategory::findOrFail($validated['expense_category_id']);
        $approvalStatus = $validated['approval_status'] ?? 'draft';

        Expense::create([
            'branch_id' => $validated['branch_id'],
            'vendor_id' => $validated['vendor_id'] ?? null,
            'title' => $validated['title'],
            'expense_type' => $category->slug,
            'expense_category_id' => $category->id,
            'account_id' => $validated['account_id'] ?? $category->expense_account_id,
            'paid_from_account_id' => $validated['paid_from_account_id'] ?? null,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'description' => $validated['description'] ?? null,
            'expense_date' => $validated['expense_date'],
            'approval_status' => $approvalStatus,
            'created_by' => $request->user()?->id,
            'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
            'approved_at' => $approvalStatus === 'approved' ? now() : null,
        ]);

        return redirect()->route('finance.expenses.index')
            ->with('success', 'Expense created successfully.');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $this->validateExpense($request);
        $category = ExpenseCategory::findOrFail($validated['expense_category_id']);
        $approvalStatus = $validated['approval_status'] ?? $expense->approval_status ?? 'draft';

        $expense->update([
            'branch_id' => $validated['branch_id'],
            'vendor_id' => $validated['vendor_id'] ?? null,
            'title' => $validated['title'],
            'expense_type' => $category->slug,
            'expense_category_id' => $category->id,
            'account_id' => $validated['account_id'] ?? $category->expense_account_id,
            'paid_from_account_id' => $validated['paid_from_account_id'] ?? null,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'description' => $validated['description'] ?? null,
            'expense_date' => $validated['expense_date'],
            'approval_status' => $approvalStatus,
            'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
            'approved_at' => $approvalStatus === 'approved' ? now() : null,
        ]);

        return redirect()->route('finance.expenses.index')
            ->with('success', 'Expense updated successfully.');
    }

    public function approve(Request $request, Expense $expense)
    {
        $expense->update([
            'approval_status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        return redirect()->route('finance.expenses.index')
            ->with('success', 'Expense approved successfully.');
    }

    protected function validateExpense(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'account_id' => ['nullable', 'exists:finance_accounts,id'],
            'paid_from_account_id' => ['nullable', 'exists:finance_accounts,id'],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'expense_date' => ['required', 'date_format:Y-m-d'],
            'approval_status' => ['nullable', 'in:draft,submitted,approved'],
        ]);
    }
}
