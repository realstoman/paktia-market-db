<?php

namespace App\Services\Dashboard;

use App\Enums\PermissionEnum;
use App\Models\Branch;
use App\Models\CashMovement;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\PayrollRunItem;
use App\Models\User;
use Carbon\CarbonImmutable;

class DashboardService
{
    public function build(User $user): array
    {
        $inventory = null;
        $finance = null;
        $branches = Branch::query()
            ->withCount(['inventoryItems', 'employees'])
            ->orderBy('name')
            ->get();

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
            $trendStart = CarbonImmutable::now()->startOfMonth()->subMonths(9);
            $monthlyCashMovements = CashMovement::query()
                ->where('approval_status', 'approved')
                ->whereDate('movement_date', '>=', $trendStart)
                ->get(['movement_date', 'direction', 'amount'])
                ->groupBy(fn (CashMovement $movement) => $movement->movement_date->format('Y-m'))
                ->map(fn ($movements) => round($movements->sum(
                    fn (CashMovement $movement) => $movement->direction === 'in'
                        ? (float) $movement->amount
                        : -((float) $movement->amount),
                ), 2));

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
                'trend' => collect(range(0, 9))
                    ->map(function (int $monthOffset) use ($monthlyCashMovements, $trendStart) {
                        $month = $trendStart->addMonths($monthOffset);

                        return [
                            'period' => $month->format('Y-m'),
                            'value' => (float) ($monthlyCashMovements->get($month->format('Y-m')) ?? 0),
                        ];
                    })
                    ->all(),
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
            'portfolio' => [
                'totalProjects' => $branches->count(),
                'activeProjects' => $branches->where('is_active', true)->count(),
                'totalFloors' => 0,
                'totalShops' => 0,
                'registeredTenants' => 0,
                'projects' => $branches->map(function (Branch $branch) {
                    $approvedExpenses = (float) Expense::query()
                        ->where('branch_id', $branch->id)
                        ->where('approval_status', 'approved')
                        ->sum('amount');
                    $cashPosition = (float) CashMovement::query()
                        ->where('branch_id', $branch->id)
                        ->where('approval_status', 'approved')
                        ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total")
                        ->value('total');

                    return [
                        'id' => $branch->id,
                        'name' => $branch->name,
                        'address' => $branch->address,
                        'isActive' => (bool) $branch->is_active,
                        'floors' => 0,
                        'shops' => 0,
                        'occupiedShops' => 0,
                        'availableShops' => 0,
                        'registeredTenants' => 0,
                        'inventoryItems' => (int) $branch->inventory_items_count,
                        'employees' => (int) $branch->employees_count,
                        'rent' => [
                            'collectedAfn' => 0,
                            'remainingAfn' => 0,
                            'collectedUsd' => 0,
                            'remainingUsd' => 0,
                        ],
                        'expensesAfn' => $approvedExpenses,
                        'cashPositionAfn' => $cashPosition,
                        'recentExpenses' => Expense::query()
                            ->where('branch_id', $branch->id)
                            ->latest('expense_date')
                            ->limit(5)
                            ->get()
                            ->map(fn (Expense $expense) => [
                                'id' => $expense->id,
                                'title' => $expense->title,
                                'amount' => (float) $expense->amount,
                                'date' => $expense->expense_date,
                                'status' => $expense->approval_status,
                            ]),
                    ];
                })->values(),
            ],
            'inventory' => $inventory,
            'finance' => $finance,
        ];
    }
}
