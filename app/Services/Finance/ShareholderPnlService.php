<?php

namespace App\Services\Finance;

use App\Models\Expense;
use App\Models\PropertyShareholding;
use App\Models\RentPayment;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ShareholderPnlService
{
    public function rows(Carbon $startDate, Carbon $endDate, ?int $propertyId = null): Collection
    {
        $revenue = RentPayment::query()
            ->where('status', 'received')
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw('property_id, COALESCE(SUM(amount), 0) as total')
            ->groupBy('property_id')
            ->pluck('total', 'property_id');
        $expenses = Expense::query()
            ->where('approval_status', 'approved')
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw('property_id, COALESCE(SUM(amount), 0) as total')
            ->groupBy('property_id')
            ->pluck('total', 'property_id');

        return PropertyShareholding::query()
            ->with(['shareholder:id,full_name', 'property:id,name,name_translations'])
            ->effectiveDuring($startDate->toDateString(), $endDate->toDateString())
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->get()
            ->map(function (PropertyShareholding $holding) use ($revenue, $expenses): array {
                $propertyRevenue = (float) ($revenue[$holding->property_id] ?? 0);
                $propertyExpenses = (float) ($expenses[$holding->property_id] ?? 0);
                $net = $propertyRevenue - $propertyExpenses;

                return [
                    'id' => $holding->id,
                    'shareholder' => $holding->shareholder?->full_name ?? '-',
                    'property' => $holding->property?->name ?? '-',
                    'percentage' => (float) $holding->percentage,
                    'revenue' => $propertyRevenue,
                    'expenses' => $propertyExpenses,
                    'net' => $net,
                    'allocated' => $holding->allocatedAmount($net),
                ];
            });
    }
}
