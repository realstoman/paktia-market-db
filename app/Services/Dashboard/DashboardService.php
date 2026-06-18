<?php

namespace App\Services\Dashboard;

use App\Enums\PermissionEnum;
use App\Models\CashMovement;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\PayrollRunItem;
use App\Models\Property;
use App\Models\User;
use Carbon\CarbonImmutable;

class DashboardService
{
    public function build(User $user): array
    {
        $inventory = null;
        $finance = null;
        $properties = Property::query()
            ->withCount(['inventoryItems', 'employees', 'floors', 'units'])
            ->orderBy('name')
            ->get();

        if ($user->can(PermissionEnum::INVENTORY_VIEW->value)) {
            $items = InventoryItem::query()->with('property:id,name')->get();

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
                        'property' => $item->property?->name ?? 'Unassigned',
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
                    ->with('property:id,name')
                    ->latest('expense_date')
                    ->limit(6)
                    ->get()
                    ->map(fn (Expense $expense) => [
                        'id' => $expense->id,
                        'title' => $expense->title,
                        'amount' => (float) $expense->amount,
                        'date' => $expense->expense_date,
                        'status' => $expense->approval_status,
                        'property' => $expense->property?->name ?? 'Unassigned',
                    ]),
            ];
        }

        return [
            'portfolio' => [
                'totalProjects' => $properties->count(),
                'activeProjects' => $properties->where('is_active', true)->count(),
                'totalFloors' => $properties->sum('floors_count'),
                'totalShops' => $properties->sum('units_count'),
                'registeredTenants' => 0,
                'projects' => $properties->map(function (Property $property) {
                    $approvedExpenses = (float) Expense::query()
                        ->where('property_id', $property->id)
                        ->where('approval_status', 'approved')
                        ->sum('amount');
                    $cashPosition = (float) CashMovement::query()
                        ->where('property_id', $property->id)
                        ->where('approval_status', 'approved')
                        ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total")
                        ->value('total');

                    return [
                        'id' => $property->id,
                        'name' => $property->name,
                        'type' => $property->property_type,
                        'address' => $property->address,
                        'isActive' => (bool) $property->is_active,
                        'floors' => (int) $property->floors_count,
                        'shops' => $property->property_type === 'house'
                            ? (int) ($property->rooms_count ?? 0)
                            : (int) $property->units_count,
                        'occupiedShops' => (int) $property->units()
                            ->where('occupancy_status', 'occupied')
                            ->count(),
                        'availableShops' => (int) $property->units()
                            ->where('occupancy_status', 'vacant')
                            ->count(),
                        'registeredTenants' => 0,
                        'inventoryItems' => (int) $property->inventory_items_count,
                        'employees' => (int) $property->employees_count,
                        'rent' => [
                            'collectedAfn' => 0,
                            'remainingAfn' => 0,
                            'collectedUsd' => 0,
                            'remainingUsd' => 0,
                        ],
                        'expensesAfn' => $approvedExpenses,
                        'cashPositionAfn' => $cashPosition,
                        'recentExpenses' => Expense::query()
                            ->where('property_id', $property->id)
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
