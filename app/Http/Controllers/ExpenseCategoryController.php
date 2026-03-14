<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Models\FinanceAccount;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ExpenseCategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('finance/expense-categories/index', [
            'expenseCategories' => ExpenseCategory::query()
                ->withCount('expenses')
                ->with('expenseAccount:id,name,code')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
            'financeAccounts' => FinanceAccount::query()
                ->where('status', 'active')
                ->where('type', 'expense')
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:expense_categories,name'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:expense_categories,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'expense_account_id' => ['nullable', 'exists:finance_accounts,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        ExpenseCategory::create([
            'name' => $validated['name'],
            'slug' => $this->makeSlug($validated['slug'] ?? $validated['name']),
            'description' => $validated['description'] ?? null,
            'expense_account_id' => $validated['expense_account_id'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('finance.expense-categories.index')
            ->with('success', 'Expense category created successfully.');
    }

    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('expense_categories', 'name')->ignore($expenseCategory->id)],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('expense_categories', 'slug')->ignore($expenseCategory->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'expense_account_id' => ['nullable', 'exists:finance_accounts,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $expenseCategory->update([
            'name' => $validated['name'],
            'slug' => $this->makeSlug($validated['slug'] ?? $validated['name']),
            'description' => $validated['description'] ?? null,
            'expense_account_id' => $validated['expense_account_id'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('finance.expense-categories.index')
            ->with('success', 'Expense category updated successfully.');
    }

    public function destroy(ExpenseCategory $expenseCategory)
    {
        if ($expenseCategory->expenses()->exists()) {
            $expenseCategory->update(['is_active' => false]);

            return redirect()->route('finance.expense-categories.index')
                ->with('success', 'Expense category was deactivated because it is already used in expenses.');
        }

        $expenseCategory->delete();

        return redirect()->route('finance.expense-categories.index')
            ->with('success', 'Expense category deleted successfully.');
    }

    protected function makeSlug(string $value): string
    {
        return str($value)
            ->trim()
            ->lower()
            ->replace(['/', ' '], ['_', '_'])
            ->replace('-', '_')
            ->value();
    }
}
