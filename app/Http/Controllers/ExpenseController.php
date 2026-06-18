<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinanceAccount;
use App\Models\Property;
use App\Models\Vendor;
use App\Services\Finance\PayrollExpenseSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function __construct(
        private readonly PayrollExpenseSyncService $payrollExpenseSyncService,
    ) {}

    public function index()
    {
        $this->payrollExpenseSyncService->syncMissingPaidItems();

        $paidFromAccounts = FinanceAccount::query()
            ->where('status', 'active')
            ->where('is_postable', true)
            ->where('type', 'asset')
            ->where(function ($query) {
                $query->whereIn('code', ['1100', '1200', '1500'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%cash%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%bank%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%petty%']);
            })
            ->orderBy('code')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'type']);

        return Inertia::render('finance/expenses/index', [
            'expenses' => Expense::query()
                ->with([
                    'property:id,name,name_translations',
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
            'properties' => Property::orderBy('name')->get(['id', 'name', 'name_translations', 'address', 'address_translations']),
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
            'paidFromAccounts' => $paidFromAccounts,
            'printExpenseId' => session('print_expense_id'),
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizePaymentMethodInput($request);
        $validated = $this->validateExpense($request);
        $category = ExpenseCategory::findOrFail($validated['expense_category_id']);
        $approvalStatus = $validated['approval_status'] ?? 'draft';

        $expense = Expense::create([
            'property_id' => $validated['property_id'],
            'vendor_id' => $validated['vendor_id'] ?? null,
            'title' => $validated['title'],
            'expense_type' => $category->slug,
            'expense_category_id' => $category->id,
            'account_id' => $validated['account_id'] ?? $category->expense_account_id,
            'paid_from_account_id' => $validated['paid_from_account_id'] ?? null,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'description' => $validated['description'] ?? null,
            'attachments' => $this->resolveAttachments($request, null),
            'expense_date' => $validated['expense_date'],
            'approval_status' => $approvalStatus,
            'created_by' => $request->user()?->id,
            'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
            'approved_at' => $approvalStatus === 'approved' ? now() : null,
        ]);

        $redirect = redirect()->route('finance.expenses.index')
            ->with('success', 'Expense created successfully.')
            ->with('notification', [
                'id' => 'expense-created-'.$expense->id.'-'.now()->timestamp,
                'category' => 'payments',
                'title' => 'Expense recorded',
                'description' => "Expense \"{$expense->title}\" was recorded.",
                'href' => '/finance/expenses',
                'priority' => $approvalStatus === 'approved' ? 'high' : 'medium',
                'meta' => $expense->amount !== null ? 'Amount • '.number_format((float) $expense->amount, 0).' ؋' : null,
            ]);

        if ($approvalStatus === 'submitted') {
            $redirect->with('print_expense_id', $expense->id);
        }

        return $redirect;
    }

    public function update(Request $request, Expense $expense)
    {
        if (($expense->approval_status ?? 'draft') === 'approved') {
            return redirect()
                ->route('finance.expenses.index')
                ->withErrors(['expense' => 'Approved expenses are locked. Cancel the expense if it should no longer apply.']);
        }

        $this->normalizePaymentMethodInput($request);
        $validated = $this->validateExpense($request);
        $category = ExpenseCategory::findOrFail($validated['expense_category_id']);
        $approvalStatus = $validated['approval_status'] ?? $expense->approval_status ?? 'draft';

        $previousStatus = $expense->approval_status ?? 'draft';
        $previousPropertyId = $expense->property_id;
        $previousExpenseDate = $expense->expense_date;

        $expense->update([
            'property_id' => $validated['property_id'],
            'vendor_id' => $validated['vendor_id'] ?? null,
            'title' => $validated['title'],
            'expense_type' => $category->slug,
            'expense_category_id' => $category->id,
            'account_id' => $validated['account_id'] ?? $category->expense_account_id,
            'paid_from_account_id' => $validated['paid_from_account_id'] ?? null,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'description' => $validated['description'] ?? null,
            'attachments' => $this->resolveAttachments($request, $expense),
            'expense_date' => $validated['expense_date'],
            'approval_status' => $approvalStatus,
            'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
            'approved_at' => $approvalStatus === 'approved' ? now() : null,
        ]);

        $redirect = redirect()->route('finance.expenses.index')
            ->with('success', 'Expense updated successfully.');

        if (
            $approvalStatus === 'submitted'
            && in_array($previousStatus, ['draft', null], true)
        ) {
            $redirect->with('print_expense_id', $expense->id);
        }

        return $redirect->with('notification', [
            'id' => 'expense-updated-'.$expense->id.'-'.now()->timestamp,
            'category' => 'payments',
            'title' => 'Expense updated',
            'description' => "Expense \"{$expense->title}\" was updated.",
            'href' => '/finance/expenses',
            'priority' => 'medium',
            'meta' => $expense->amount !== null ? 'Amount • '.number_format((float) $expense->amount, 0).' ؋' : null,
        ]);
    }

    public function approve(Request $request, Expense $expense)
    {
        $expense->update([
            'approval_status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        return redirect()->route('finance.expenses.index')
            ->with('success', 'Expense approved successfully.')
            ->with('notification', [
                'id' => 'expense-approved-'.$expense->id.'-'.now()->timestamp,
                'category' => 'payments',
                'title' => 'Expense approved',
                'description' => "Expense \"{$expense->title}\" was approved and posted to finance.",
                'href' => '/finance/expenses',
                'priority' => 'high',
                'meta' => $expense->amount !== null ? 'Amount • '.number_format((float) $expense->amount, 0).' ؋' : null,
            ]);
    }

    public function reject(Request $request, Expense $expense)
    {
        $isApproved = ($expense->approval_status ?? 'draft') === 'approved';

        $expense->update([
            'approval_status' => $isApproved ? 'cancelled' : 'draft',
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return redirect()->route('finance.expenses.index')
            ->with('success', $isApproved ? 'Expense was cancelled successfully.' : 'Expense was sent back to draft.')
            ->with('notification', [
                'id' => 'expense-status-'.$expense->id.'-'.now()->timestamp,
                'category' => 'payments',
                'title' => $isApproved ? 'Expense cancelled' : 'Expense returned to draft',
                'description' => $isApproved
                    ? "Expense \"{$expense->title}\" was cancelled."
                    : "Expense \"{$expense->title}\" was returned to draft.",
                'href' => '/finance/expenses',
                'priority' => $isApproved ? 'high' : 'medium',
                'meta' => $expense->amount !== null ? 'Amount • '.number_format((float) $expense->amount, 0).' ؋' : null,
            ]);
    }

    protected function validateExpense(Request $request): array
    {
        return $request->validate([
            'property_id' => ['required', 'exists:properties,id'],
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'account_id' => ['nullable', 'exists:finance_accounts,id'],
            'paid_from_account_id' => ['nullable', 'exists:finance_accounts,id'],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'expense_date' => ['required', 'date_format:Y-m-d'],
            'approval_status' => ['nullable', 'in:draft,submitted,approved,cancelled'],
        ]);
    }

    protected function normalizePaymentMethodInput(Request $request): void
    {
        $raw = strtolower(trim((string) $request->input('payment_method', '')));

        $normalized = match ($raw) {
            'card', 'creditcard', 'credit card' => PaymentMethod::CREDIT_CARD->value,
            'bank', 'bank transfer', 'bank-transfer' => PaymentMethod::BANK_TRANSFER->value,
            'crypto' => PaymentMethod::OTHER->value,
            default => $raw,
        };

        if ($normalized !== '') {
            $request->merge([
                'payment_method' => $normalized,
            ]);
        }
    }

    protected function resolveAttachments(Request $request, ?Expense $expense): ?array
    {
        $current = is_array($expense?->attachments) ? $expense->attachments : [];

        if (! $request->hasFile('receipt')) {
            return empty($current) ? null : $current;
        }

        if (! empty($current)) {
            Storage::disk('public')->delete($current);
        }

        $path = $request->file('receipt')->store('finance/expenses/receipts', 'public');

        return [$path];
    }
}
