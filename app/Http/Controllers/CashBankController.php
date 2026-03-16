<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\Branch;
use App\Models\CashMovement;
use App\Models\CashMovementType;
use App\Models\FinanceAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CashBankController extends Controller
{
    public function index()
    {
        $sourceAccounts = $this->liquidityAccounts();

        return Inertia::render('finance/cash-bank/index', [
            'movements' => CashMovement::query()
                ->with([
                    'branch:id,name',
                    'account:id,code,name',
                    'counterpartyAccount:id,code,name',
                    'creator:id,name',
                    'approver:id,name',
                ])
                ->orderByDesc('movement_date')
                ->orderByDesc('id')
                ->get(),
            'branches' => Branch::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'sourceAccounts' => $sourceAccounts,
            'targetAccounts' => $sourceAccounts,
            'movementTypes' => CashMovementType::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'default_direction', 'requires_counterparty']),
        ]);
    }

    public function store(Request $request)
    {
        $movementType = CashMovementType::query()
            ->where('slug', $request->input('movement_type'))
            ->where('is_active', true)
            ->first();

        $validated = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'destination_branch_id' => ['nullable', 'exists:branches,id'],
            'movement_type' => [
                'required',
                Rule::exists('cash_movement_types', 'slug')->where(
                    fn ($query) => $query->where('is_active', true)
                ),
            ],
            'direction' => ['nullable', Rule::in(['in', 'out'])],
            'movement_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'account_id' => ['required', 'exists:finance_accounts,id'],
            'counterparty_account_id' => [
                'nullable',
                'exists:finance_accounts,id',
                Rule::requiredIf(function () use ($movementType) {
                    return (bool) $movementType?->requires_counterparty;
                }),
            ],
            'approval_status' => ['nullable', Rule::in(['draft', 'submitted', 'approved'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $approvalStatus = $validated['approval_status'] ?? 'approved';

        DB::transaction(function () use ($request, $validated, $approvalStatus) {
            if ((bool) $movementType?->requires_counterparty) {
                $this->createTransferPair($request, $validated, $approvalStatus);
                return;
            }

            CashMovement::create([
                'branch_id' => $validated['branch_id'] ?? null,
                'movement_type' => $validated['movement_type'],
                'direction' => $this->resolveDirection(
                    movementType: $validated['movement_type'],
                    requestedDirection: $validated['direction'] ?? null,
                    defaultDirection: $movementType?->default_direction,
                ),
                'movement_date' => $validated['movement_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'account_id' => $validated['account_id'],
                'counterparty_account_id' => $validated['counterparty_account_id'] ?? null,
                'created_by' => $request->user()?->id,
                'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
                'approval_status' => $approvalStatus,
                'description' => $validated['description'] ?? null,
            ]);
        });

        return redirect()
            ->route('finance.cash-bank.index')
            ->with('success', 'Cash movement recorded successfully.');
    }

    public function approve(Request $request, CashMovement $cashMovement)
    {
        $cashMovement->update([
            'approval_status' => 'approved',
            'approved_by' => $request->user()?->id,
        ]);

        return redirect()
            ->route('finance.cash-bank.index')
            ->with('success', 'Cash movement approved successfully.');
    }

    protected function createTransferPair(Request $request, array $validated, string $approvalStatus): void
    {
        if (empty($validated['counterparty_account_id'])) {
            abort(422, 'Target account is required for transfer.');
        }

        $sourceBranchId = $validated['branch_id'] ?? null;
        $destinationBranchId = $validated['destination_branch_id'] ?? $sourceBranchId;

        $outgoing = CashMovement::create([
            'branch_id' => $sourceBranchId,
            'movement_type' => $validated['movement_type'],
            'direction' => 'out',
            'movement_date' => $validated['movement_date'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'account_id' => $validated['account_id'],
            'counterparty_account_id' => $validated['counterparty_account_id'],
            'created_by' => $request->user()?->id,
            'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
            'approval_status' => $approvalStatus,
            'description' => $validated['description'] ?? null,
        ]);

        $incoming = CashMovement::create([
            'branch_id' => $destinationBranchId,
            'movement_type' => $validated['movement_type'],
            'direction' => 'in',
            'movement_date' => $validated['movement_date'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'account_id' => $validated['counterparty_account_id'],
            'counterparty_account_id' => $validated['account_id'],
            'reference_type' => 'cash_transfer',
            'reference_id' => $outgoing->id,
            'created_by' => $request->user()?->id,
            'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
            'approval_status' => $approvalStatus,
            'description' => $validated['description'] ?? null,
        ]);

        $outgoing->update([
            'reference_type' => 'cash_transfer',
            'reference_id' => $incoming->id,
        ]);
    }

    protected function resolveDirection(
        string $movementType,
        ?string $requestedDirection,
        ?string $defaultDirection = null
    ): string
    {
        return match ($movementType) {
            'owner_deposit', 'bank_withdrawal' => 'in',
            'owner_withdrawal', 'bank_deposit' => 'out',
            default => $defaultDirection ?? $requestedDirection ?? 'in',
        };
    }

    protected function liquidityAccounts()
    {
        return FinanceAccount::query()
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
    }
}
