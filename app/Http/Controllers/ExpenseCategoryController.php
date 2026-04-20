<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Models\FinanceAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ExpenseCategoryController extends Controller
{
    private function authorizeDelete(Request $request): void
    {
        abort_unless($request->user()?->hasRole('super-admin') === true, 403);
    }

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

    public function destroy(Request $request, ExpenseCategory $expenseCategory)
    {
        $this->authorizeDelete($request);

        if ($expenseCategory->expenses()->exists()) {
            $replacementCategoryId = $request->integer(
                'replacement_category_id',
            );

            if (
                ! $replacementCategoryId ||
                $replacementCategoryId === $expenseCategory->id
            ) {
                throw ValidationException::withMessages([
                    'replacement_category_id' => 'Select another expense category before deleting this one.',
                ]);
            }

            $replacementCategory = ExpenseCategory::query()
                ->whereKeyNot($expenseCategory->id)
                ->find($replacementCategoryId);

            if (! $replacementCategory) {
                throw ValidationException::withMessages([
                    'replacement_category_id' => 'Create or select another expense category before deleting this one.',
                ]);
            }

            DB::transaction(function () use (
                $expenseCategory,
                $replacementCategory,
            ) {
                DB::table('expenses')
                    ->where('expense_category_id', $expenseCategory->id)
                    ->update([
                        'expense_category_id' => $replacementCategory->id,
                        'expense_type' => $replacementCategory->slug,
                    ]);

                $expenseCategory->delete();
            });

            return redirect()->route('finance.expense-categories.index')
                ->with('success', 'Expense category reassigned and deleted successfully.');
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
