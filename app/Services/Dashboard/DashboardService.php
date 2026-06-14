<?php

namespace App\Services\Dashboard;

use App\Enums\PermissionEnum;
use App\Models\CashMovement;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\PayrollRunItem;
use App\Models\User;

class DashboardService
{
    public function build(User $user): array
    {
        $inventory = null;
        $finance = null;

        if ($user->can(PermissionEnum::INVENTORY_VIEW->value)) {
            $items = InventoryItem::query()->with('branch:id,name')->get();

            $inventory = [
                'totalItems' => $items->count(),
                'lowStockItems' => $items->filter(
                    fn (InventoryItem $item) => (float) $item->quantity > 0 && (float) $item->quantity <= 10,
                )->count(),
                'outOfStockItems' => $items->filter(
                    fn (InventoryItem $item) => (float) $item->quantity <= 0,
                )->count(),
                'inventoryValue' => round($items->sum(
                    fn (InventoryItem $item) => (float) $item->quantity * (float) ($item->unit_price ?? 0),
                ), 2),
                'lowStockQuickList' => $items
                    ->filter(fn (InventoryItem $item) => (float) $item->quantity <= 10)
                    ->sortBy(fn (InventoryItem $item) => (float) $item->quantity)
                    ->take(6)
                    ->values()
                    ->map(fn (InventoryItem $item) => [
                        'id' => $item->id,
                        'name' => $item->name,
                        'quantity' => (float) $item->quantity,
                        'unit' => $item->unit,
                        'branch' => $item->branch?->name ?? 'Unassigned',
                    ]),
            ];
        }

        if ($user->can(PermissionEnum::FINANCE_VIEW->value)) {
            $approvedExpenses = (float) Expense::query()
                ->where('approval_status', 'approved')
                ->sum('amount');
            $cashPosition = (float) CashMovement::query()
                ->where('approval_status', 'approved')
                ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total")
                ->value('total');
            $unpaidPayroll = (float) PayrollRunItem::query()
                ->where('payment_status', '!=', 'paid')
                ->sum('net_salary');

            $finance = [
                'expenses' => $approvedExpenses,
                'cashPosition' => $cashPosition,
                'unpaidPayroll' => $unpaidPayroll,
                'pendingExpenses' => Expense::query()->where('approval_status', 'submitted')->count(),
                'recentExpenses' => Expense::query()
                    ->with('branch:id,name')
                    ->latest('expense_date')
                    ->limit(6)
                    ->get()
                    ->map(fn (Expense $expense) => [
                        'id' => $expense->id,
                        'title' => $expense->title,
                        'amount' => (float) $expense->amount,
                        'date' => $expense->expense_date,
                        'status' => $expense->approval_status,
                        'branch' => $expense->branch?->name ?? 'Unassigned',
                    ]),
            ];
        }

        return [
            'inventory' => $inventory,
            'finance' => $finance,
        ];
    }
}
