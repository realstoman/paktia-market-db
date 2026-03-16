<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Currency;
use App\Models\FinanceAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ChartOfAccountController extends Controller
{
    public function index()
    {
        return Inertia::render('finance/chart-of-accounts/index', [
            'accounts' => FinanceAccount::query()
                ->with([
                    'parent:id,code,name',
                    'branch:id,name',
                ])
                ->orderBy('code')
                ->orderBy('name')
                ->get(),
            'branches' => Branch::query()
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
            'branch_id' => $validated['branch_id'] ?? null,
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
            'branch_id' => $validated['branch_id'] ?? null,
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

    public function destroy(FinanceAccount $financeAccount)
    {
        if ($financeAccount->is_system) {
            return redirect()
                ->route('finance.chart-of-accounts.index')
                ->with('error', 'System accounts cannot be deleted.');
        }

        if ($this->hasDependencies($financeAccount)) {
            $financeAccount->update(['status' => 'inactive']);

            return redirect()
                ->route('finance.chart-of-accounts.index')
                ->with('success', 'Account was deactivated because it is already in use.');
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
            'branch_id' => ['nullable', 'exists:branches,id'],
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
