<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\Branch;
use App\Models\CashMovement;
use App\Models\CashMovementType;
use App\Models\FinanceAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
                ->get(['id', 'name', 'address']),
            'sourceAccounts' => $sourceAccounts,
            'targetAccounts' => $sourceAccounts,
            'movementTypes' => CashMovementType::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'default_direction', 'requires_counterparty']),
            'printMovementId' => session('print_movement_id'),
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
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $approvalStatus = $validated['approval_status'] ?? 'draft';
        $attachmentPath = $request->hasFile('receipt')
            ? $request->file('receipt')->store('finance/cash-bank/receipts', 'public')
            : null;

        $createdMovement = null;

        DB::transaction(function () use ($request, $validated, $approvalStatus, $movementType, $attachmentPath, &$createdMovement) {
            if ((bool) $movementType?->requires_counterparty) {
                $createdMovement = $this->createTransferPair(
                    $request,
                    $validated,
                    $approvalStatus,
                    $attachmentPath
                );
                return;
            }

            $createdMovement = CashMovement::create([
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
                'attachment_path' => $attachmentPath,
            ]);
        });

        $redirect = redirect()
            ->route('finance.cash-bank.index')
            ->with('success', 'Cash movement recorded successfully.');

        if (
            $approvalStatus === 'submitted'
            && $createdMovement instanceof CashMovement
        ) {
            $redirect->with('print_movement_id', $createdMovement->id);
        }

        return $redirect;
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

    public function reject(Request $request, CashMovement $cashMovement)
    {
        $cashMovement->update([
            'approval_status' => 'draft',
            'approved_by' => null,
        ]);

        return redirect()
            ->route('finance.cash-bank.index')
            ->with('success', 'Cash movement was sent back to draft.');
    }

    public function update(Request $request, CashMovement $cashMovement)
    {
        if (($cashMovement->approval_status ?? 'draft') === 'approved') {
            return redirect()
                ->route('finance.cash-bank.index')
                ->withErrors([
                    'movement' => 'Approved movement cannot be edited.',
                ]);
        }

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
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $previousStatus = $cashMovement->approval_status ?? 'draft';
        $approvalStatus = $validated['approval_status'] ?? $previousStatus;
        $printMovementId = $cashMovement->id;

        DB::transaction(function () use (
            $request,
            $cashMovement,
            $validated,
            $movementType,
            $approvalStatus,
            &$printMovementId
        ) {
            if ($cashMovement->reference_type === 'cash_transfer') {
                if (! (bool) $movementType?->requires_counterparty) {
                    abort(422, 'Transfer movement type cannot be changed to a non-transfer type.');
                }

                $pairedMovement = CashMovement::query()->find($cashMovement->reference_id);
                if (! $pairedMovement) {
                    abort(422, 'Linked transfer movement is missing.');
                }

                $outgoing = $cashMovement->direction === 'out' ? $cashMovement : $pairedMovement;
                $incoming = $cashMovement->direction === 'out' ? $pairedMovement : $cashMovement;

                if (
                    ($outgoing->approval_status ?? 'draft') === 'approved'
                    || ($incoming->approval_status ?? 'draft') === 'approved'
                ) {
                    abort(422, 'Approved transfer movement cannot be edited.');
                }

                $attachmentPath = $this->resolveTransferAttachmentPath(
                    $request,
                    $outgoing,
                    $incoming
                );
                $sourceBranchId = $validated['branch_id'] ?? $outgoing->branch_id;
                $destinationBranchId = $validated['destination_branch_id'] ?? $incoming->branch_id ?? $sourceBranchId;

                $outgoing->update([
                    'branch_id' => $sourceBranchId,
                    'movement_type' => $validated['movement_type'],
                    'direction' => 'out',
                    'movement_date' => $validated['movement_date'],
                    'amount' => $validated['amount'],
                    'payment_method' => $validated['payment_method'],
                    'account_id' => $validated['account_id'],
                    'counterparty_account_id' => $validated['counterparty_account_id'],
                    'approval_status' => $approvalStatus,
                    'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
                    'description' => $validated['description'] ?? null,
                    'attachment_path' => $attachmentPath,
                ]);

                $incoming->update([
                    'branch_id' => $destinationBranchId,
                    'movement_type' => $validated['movement_type'],
                    'direction' => 'in',
                    'movement_date' => $validated['movement_date'],
                    'amount' => $validated['amount'],
                    'payment_method' => $validated['payment_method'],
                    'account_id' => $validated['counterparty_account_id'],
                    'counterparty_account_id' => $validated['account_id'],
                    'approval_status' => $approvalStatus,
                    'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
                    'description' => $validated['description'] ?? null,
                    'attachment_path' => $attachmentPath,
                ]);

                $printMovementId = $outgoing->id;
                return;
            }

            $attachmentPath = $this->resolveAttachmentPath($request, $cashMovement);

            $cashMovement->update([
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
                'approval_status' => $approvalStatus,
                'approved_by' => $approvalStatus === 'approved' ? $request->user()?->id : null,
                'description' => $validated['description'] ?? null,
                'attachment_path' => $attachmentPath,
            ]);
        });

        $redirect = redirect()
            ->route('finance.cash-bank.index')
            ->with('success', 'Cash movement updated successfully.');

        if (
            $approvalStatus === 'submitted'
            && in_array($previousStatus, ['draft', null], true)
        ) {
            $redirect->with('print_movement_id', $printMovementId);
        }

        return $redirect;
    }

    protected function createTransferPair(
        Request $request,
        array $validated,
        string $approvalStatus,
        ?string $attachmentPath = null
    ): CashMovement
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
            'attachment_path' => $attachmentPath,
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
            'attachment_path' => $attachmentPath,
        ]);

        $outgoing->update([
            'reference_type' => 'cash_transfer',
            'reference_id' => $incoming->id,
        ]);

        return $outgoing;
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

    protected function resolveAttachmentPath(Request $request, CashMovement $cashMovement): ?string
    {
        if (! $request->hasFile('receipt')) {
            return $cashMovement->attachment_path;
        }

        if ($cashMovement->attachment_path) {
            Storage::disk('public')->delete($cashMovement->attachment_path);
        }

        return $request->file('receipt')->store('finance/cash-bank/receipts', 'public');
    }

    protected function resolveTransferAttachmentPath(
        Request $request,
        CashMovement $outgoing,
        CashMovement $incoming
    ): ?string {
        if (! $request->hasFile('receipt')) {
            return $outgoing->attachment_path
                ?? $incoming->attachment_path;
        }

        $paths = array_values(array_filter([
            $outgoing->attachment_path,
            $incoming->attachment_path,
        ]));

        if (! empty($paths)) {
            Storage::disk('public')->delete($paths);
        }

        return $request->file('receipt')->store('finance/cash-bank/receipts', 'public');
    }
}
