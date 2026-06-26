<?php

namespace App\Services\Dashboard;

use App\Enums\PermissionEnum;
use App\Models\CashMovement;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Lease;
use App\Models\PayrollRunItem;
use App\Models\Property;
use App\Models\RentPayment;
use App\Models\User;
use Carbon\CarbonImmutable;

class DashboardService
{
    public function build(User $user): array
    {
        $inventory = null;
        $finance = null;
        $monthStart = CarbonImmutable::now()->startOfMonth();
        $monthEnd = CarbonImmutable::now()->endOfMonth();
        $today = CarbonImmutable::now()->toDateString();
        $properties = Property::query()
            ->withCount(['inventoryItems', 'employees', 'floors', 'units'])
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        if ($user->can(PermissionEnum::INVENTORY_VIEW->value)) {
            $items = InventoryItem::query()->with('property:id,name,name_translations')->get();

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
                    ->with('property:id,name,name_translations')
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
                'registeredTenants' => Lease::query()
                    ->where('status', 'active')
                    ->distinct('tenant_id')
                    ->count('tenant_id'),
                'projects' => $properties->map(function (Property $property) use ($monthStart, $monthEnd, $today) {
                    $approvedExpenses = (float) Expense::query()
                        ->where('property_id', $property->id)
                        ->where('approval_status', 'approved')
                        ->sum('amount');
                    $cashPosition = (float) CashMovement::query()
                        ->where('property_id', $property->id)
                        ->where('approval_status', 'approved')
                        ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total")
                        ->value('total');
                    $monthlyCollectedRent = (float) RentPayment::query()
                        ->where('property_id', $property->id)
                        ->where('status', 'received')
                        ->whereBetween('payment_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->sum('amount');
                    $monthlyExpenses = (float) Expense::query()
                        ->where('property_id', $property->id)
                        ->where('approval_status', 'approved')
                        ->whereBetween('expense_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->sum('amount');
                    $monthlyShareholderTakeouts = (float) CashMovement::query()
                        ->where('property_id', $property->id)
                        ->where('approval_status', 'approved')
                        ->where('movement_type', 'owner_withdrawal')
                        ->where('direction', 'out')
                        ->whereBetween('movement_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->sum('amount');
                    $monthlyCashAdjustments = (float) CashMovement::query()
                        ->where('property_id', $property->id)
                        ->where('approval_status', 'approved')
                        ->whereBetween('movement_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->where(fn ($query) => $query
                            ->whereNull('movement_type')
                            ->orWhere('movement_type', '!=', 'owner_withdrawal'))
                        ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as total")
                        ->value('total');
                    $activeLeasedUnitIds = Lease::query()
                        ->where('property_id', $property->id)
                        ->where('status', 'active')
                        ->whereNotNull('property_unit_id')
                        ->whereDate('start_date', '<=', $today)
                        ->where(fn ($query) => $query
                            ->whereNull('end_date')
                            ->orWhereDate('end_date', '>=', $today))
                        ->distinct()
                        ->pluck('property_unit_id');
                    $occupiedUnits = $property->property_type === 'commercial_unit'
                        ? (int) (in_array($property->operating_mode, ['owner_occupied', 'rented'], true)
                            || Lease::query()
                                ->where('property_id', $property->id)
                                ->where('status', 'active')
                                ->whereDate('start_date', '<=', $today)
                                ->where(fn ($query) => $query
                                    ->whereNull('end_date')
                                    ->orWhereDate('end_date', '>=', $today))
                                ->exists())
                        : (int) $property->units()
                            ->where(fn ($query) => $query
                                ->where('occupancy_status', 'occupied')
                                ->when(
                                    $activeLeasedUnitIds->isNotEmpty(),
                                    fn ($units) => $units->orWhereIn('property_units.id', $activeLeasedUnitIds),
                                ))
                            ->count();
                    $shops = match ($property->property_type) {
                        'house' => (int) ($property->rooms_count ?? 0),
                        'commercial_unit' => 1,
                        default => (int) $property->units_count,
                    };
                    $registeredTenants = Lease::query()
                        ->where('property_id', $property->id)
                        ->where('status', 'active')
                        ->distinct('tenant_id')
                        ->count('tenant_id');
                    $recentRentCollections = RentPayment::query()
                        ->with([
                            'tenant:id,full_name,business_name',
                            'lease:id,contract_number,property_floor_id,property_unit_id,leased_space_type',
                            'lease.floor:id,name,level_number',
                            'lease.unit:id,unit_number,unit_type',
                            'currency:id,code,symbol',
                        ])
                        ->where('property_id', $property->id)
                        ->where('status', 'received')
                        ->latest('payment_date')
                        ->latest('id')
                        ->limit(8)
                        ->get()
                        ->map(fn (RentPayment $payment) => [
                            'id' => $payment->id,
                            'receiptNumber' => $payment->receipt_number,
                            'tenant' => $payment->tenant?->business_name ?: $payment->tenant?->full_name,
                            'shopNumber' => $payment->lease?->unit?->unit_number
                                ?? $property->external_unit_number
                                ?? $payment->lease?->leased_space_type
                                ?? '—',
                            'floor' => $payment->lease?->floor?->name,
                            'amount' => (float) $payment->amount,
                            'currency' => $payment->currency?->symbol ?: ($payment->currency?->code ?? '؋'),
                            'currencyCode' => $payment->currency?->code,
                            'paymentDate' => $payment->payment_date?->toDateString(),
                            'periodStart' => $payment->period_start?->toDateString(),
                            'periodEnd' => $payment->period_end?->toDateString(),
                            'paymentMethod' => $payment->payment_method,
                        ]);

                    return [
                        'id' => $property->id,
                        'name' => $property->name,
                        'type' => $property->property_type,
                        'address' => $property->address,
                        'isActive' => (bool) $property->is_active,
                        'floors' => (int) $property->floors_count,
                        'shops' => $shops,
                        'occupiedShops' => min($shops, $occupiedUnits),
                        'availableShops' => max(0, $shops - $occupiedUnits),
                        'registeredTenants' => $registeredTenants,
                        'inventoryItems' => (int) $property->inventory_items_count,
                        'employees' => (int) $property->employees_count,
                        'rent' => [
                            'collectedAfn' => $monthlyCollectedRent,
                            'remainingAfn' => 0,
                            'collectedUsd' => 0,
                            'remainingUsd' => 0,
                        ],
                        'financeThisMonth' => [
                            'collectedRent' => $monthlyCollectedRent,
                            'expenses' => $monthlyExpenses,
                            'shareholderTakeouts' => $monthlyShareholderTakeouts,
                            'availableCash' => $monthlyCollectedRent + $monthlyCashAdjustments - $monthlyExpenses - $monthlyShareholderTakeouts,
                        ],
                        'expensesAfn' => $approvedExpenses,
                        'cashPositionAfn' => $cashPosition,
                        'recentRentCollections' => $recentRentCollections,
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
