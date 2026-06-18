<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Currency;
use App\Models\FinanceAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ChartOfAccountController extends Controller
{
    private function authorizeDelete(Request $request): void
    {
        abort_unless($request->user()?->hasRole('super-admin') === true, 403);
    }

    public function index()
    {
        $accounts = FinanceAccount::query()
            ->with([
                'parent:id,code,name',
                'property:id,name',
            ])
            ->orderBy('code')
            ->orderBy('name')
            ->get();

        $childCounts = FinanceAccount::query()
            ->selectRaw('parent_id, COUNT(*) as aggregate')
            ->whereNotNull('parent_id')
            ->groupBy('parent_id')
            ->pluck('aggregate', 'parent_id');

        $expenseCategoryCounts = DB::table('expense_categories')
            ->selectRaw('expense_account_id, COUNT(*) as aggregate')
            ->whereNotNull('expense_account_id')
            ->groupBy('expense_account_id')
            ->pluck('aggregate', 'expense_account_id');

        $expenseAccountCounts = DB::table('expenses')
            ->selectRaw('account_id, COUNT(*) as aggregate')
            ->whereNotNull('account_id')
            ->groupBy('account_id')
            ->pluck('aggregate', 'account_id');

        $expensePaymentCounts = DB::table('expenses')
            ->selectRaw('paid_from_account_id, COUNT(*) as aggregate')
            ->whereNotNull('paid_from_account_id')
            ->groupBy('paid_from_account_id')
            ->pluck('aggregate', 'paid_from_account_id');

        $cashAccountCounts = DB::table('cash_movements')
            ->selectRaw('account_id, COUNT(*) as aggregate')
            ->whereNotNull('account_id')
            ->groupBy('account_id')
            ->pluck('aggregate', 'account_id');

        $cashCounterpartyCounts = DB::table('cash_movements')
            ->selectRaw('counterparty_account_id, COUNT(*) as aggregate')
            ->whereNotNull('counterparty_account_id')
            ->groupBy('counterparty_account_id')
            ->pluck('aggregate', 'counterparty_account_id');

        $journalCounts = DB::table('finance_journal_lines')
            ->selectRaw('account_id, COUNT(*) as aggregate')
            ->whereNotNull('account_id')
            ->groupBy('account_id')
            ->pluck('aggregate', 'account_id');

        $mappingCounts = DB::table('finance_account_mappings')
            ->selectRaw('account_id, COUNT(*) as aggregate')
            ->whereNotNull('account_id')
            ->groupBy('account_id')
            ->pluck('aggregate', 'account_id');

        $accounts->each(function (FinanceAccount $account) use (
            $childCounts,
            $expenseCategoryCounts,
            $expenseAccountCounts,
            $expensePaymentCounts,
            $cashAccountCounts,
            $cashCounterpartyCounts,
            $journalCounts,
            $mappingCounts,
        ) {
            $account->dependency_count =
                (int) ($childCounts[$account->id] ?? 0) +
                (int) ($expenseCategoryCounts[$account->id] ?? 0) +
                (int) ($expenseAccountCounts[$account->id] ?? 0) +
                (int) ($expensePaymentCounts[$account->id] ?? 0) +
                (int) ($cashAccountCounts[$account->id] ?? 0) +
                (int) ($cashCounterpartyCounts[$account->id] ?? 0) +
                (int) ($journalCounts[$account->id] ?? 0) +
                (int) ($mappingCounts[$account->id] ?? 0);
        });

        return Inertia::render('finance/chart-of-accounts/index', [
            'accounts' => $accounts,
            'properties' => Property::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'parentAccounts' => FinanceAccount::query()
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'type']),
            'currencies' => Currency::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'symbol']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateAccount($request);
        $resolvedCode = !empty($validated['code'])
            ? strtoupper($validated['code'])
            : $this->generateNextCode($validated['type']);

        FinanceAccount::create([
            'code' => $resolvedCode,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'parent_id' => $validated['parent_id'] ?? null,
            'property_id' => $validated['property_id'] ?? null,
            'currency_code' => isset($validated['currency_code'])
                ? strtoupper($validated['currency_code'])
                : null,
            'is_postable' => $validated['is_postable'] ?? true,
            'status' => $validated['status'] ?? 'active',
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('finance.chart-of-accounts.index')
            ->with('success', 'Ledger account created successfully.');
    }

    public function update(Request $request, FinanceAccount $financeAccount)
    {
        $validated = $this->validateAccount($request, $financeAccount, true);

        $financeAccount->update([
            'code' => strtoupper($validated['code'] ?? $financeAccount->code),
            'name' => $validated['name'],
            'type' => $validated['type'],
            'parent_id' => $validated['parent_id'] ?? null,
            'property_id' => $validated['property_id'] ?? null,
            'currency_code' => isset($validated['currency_code'])
                ? strtoupper($validated['currency_code'])
                : null,
            'is_postable' => $validated['is_postable'] ?? true,
            'status' => $validated['status'] ?? 'active',
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('finance.chart-of-accounts.index')
            ->with('success', 'Ledger account updated successfully.');
    }

    public function destroy(Request $request, FinanceAccount $financeAccount)
    {
        $this->authorizeDelete($request);

        if ($financeAccount->is_system) {
            return redirect()
                ->route('finance.chart-of-accounts.index')
                ->with('error', 'System accounts cannot be deleted.');
        }

        if ($this->hasDependencies($financeAccount)) {
            $replacementAccountId = $request->integer('replacement_account_id');

            if (! $replacementAccountId || $replacementAccountId === $financeAccount->id) {
                throw ValidationException::withMessages([
                    'replacement_account_id' => 'Select another ledger account before deleting this one.',
                ]);
            }

            $replacementAccount = FinanceAccount::query()
                ->whereKeyNot($financeAccount->id)
                ->find($replacementAccountId);

            if (! $replacementAccount) {
                throw ValidationException::withMessages([
                    'replacement_account_id' => 'Create or select another ledger account before deleting this one.',
                ]);
            }

            DB::transaction(function () use ($financeAccount, $replacementAccount) {
                FinanceAccount::query()
                    ->where('parent_id', $financeAccount->id)
                    ->update(['parent_id' => $replacementAccount->id]);

                DB::table('expense_categories')
                    ->where('expense_account_id', $financeAccount->id)
                    ->update(['expense_account_id' => $replacementAccount->id]);

                DB::table('expenses')
                    ->where('account_id', $financeAccount->id)
                    ->update(['account_id' => $replacementAccount->id]);

                DB::table('expenses')
                    ->where('paid_from_account_id', $financeAccount->id)
                    ->update(['paid_from_account_id' => $replacementAccount->id]);

                DB::table('cash_movements')
                    ->where('account_id', $financeAccount->id)
                    ->update(['account_id' => $replacementAccount->id]);

                DB::table('cash_movements')
                    ->where('counterparty_account_id', $financeAccount->id)
                    ->update(['counterparty_account_id' => $replacementAccount->id]);

                DB::table('finance_journal_lines')
                    ->where('account_id', $financeAccount->id)
                    ->update(['account_id' => $replacementAccount->id]);

                DB::table('finance_account_mappings')
                    ->where('account_id', $financeAccount->id)
                    ->update(['account_id' => $replacementAccount->id]);

                $financeAccount->delete();
            });

            return redirect()
                ->route('finance.chart-of-accounts.index')
                ->with('success', 'Ledger account reassigned and deleted successfully.');
        }

        $financeAccount->delete();

        return redirect()
            ->route('finance.chart-of-accounts.index')
            ->with('success', 'Ledger account deleted successfully.');
    }

    protected function validateAccount(
        Request $request,
        ?FinanceAccount $financeAccount = null,
        bool $isUpdate = false
    ): array {
        $codeRules = [
            'nullable',
            'string',
            'max:30',
            Rule::unique('finance_accounts', 'code')->ignore($financeAccount?->id),
        ];

        if ($isUpdate) {
            array_unshift($codeRules, 'required');
        }

        return $request->validate([
            'code' => $codeRules,
            'name' => ['required', 'string', 'max:255'],
            'type' => [
                'required',
                Rule::in(['asset', 'liability', 'equity', 'revenue', 'cogs', 'expense']),
            ],
            'parent_id' => [
                'nullable',
                'exists:finance_accounts,id',
                Rule::notIn([$financeAccount?->id]),
            ],
            'property_id' => ['nullable', 'exists:properties,id'],
            'currency_code' => ['nullable', 'string', 'size:3', 'exists:currencies,code'],
            'is_postable' => ['boolean'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    protected function generateNextCode(string $type): string
    {
        $startByType = [
            'asset' => 1000,
            'liability' => 2000,
            'equity' => 3000,
            'revenue' => 4000,
            'cogs' => 5000,
            'expense' => 6000,
        ];

        $start = $startByType[$type] ?? 9000;
        $end = $start + 999;

        $currentMax = (int) FinanceAccount::query()
            ->where('type', $type)
            ->whereRaw('code REGEXP "^[0-9]+$"')
            ->whereBetween(DB::raw('CAST(code AS UNSIGNED)'), [$start, $end])
            ->max(DB::raw('CAST(code AS UNSIGNED)'));

        if ($currentMax > 0) {
            return (string) ($currentMax + 10);
        }

        return (string) $start;
    }

    protected function hasDependencies(FinanceAccount $account): bool
    {
        $accountId = $account->id;

        if (FinanceAccount::where('parent_id', $accountId)->exists()) {
            return true;
        }

        if (DB::table('expense_categories')->where('expense_account_id', $accountId)->exists()) {
            return true;
        }

        if (DB::table('expenses')
            ->where('account_id', $accountId)
            ->orWhere('paid_from_account_id', $accountId)
            ->exists()) {
            return true;
        }

        if (DB::table('cash_movements')
            ->where('account_id', $accountId)
            ->orWhere('counterparty_account_id', $accountId)
            ->exists()) {
            return true;
        }

        if (DB::table('finance_journal_lines')->where('account_id', $accountId)->exists()) {
            return true;
        }

        if (DB::table('finance_account_mappings')->where('account_id', $accountId)->exists()) {
            return true;
        }

        return false;
    }
}
