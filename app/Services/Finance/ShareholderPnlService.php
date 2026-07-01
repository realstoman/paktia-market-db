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
            ->leftJoin('currencies', 'currencies.id', '=', 'rent_payments.currency_id')
            ->where('status', 'received')
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw('rent_payments.property_id, COALESCE(currencies.code, "AFN") as currency_code, COALESCE(SUM(rent_payments.amount), 0) as total')
            ->groupBy('rent_payments.property_id', 'currency_code')
            ->get()
            ->groupBy('property_id')
            ->map(fn (Collection $rows) => $rows->pluck('total', 'currency_code')->map(fn ($value) => (float) $value));
        $expenses = Expense::query()
            ->leftJoin('finance_accounts', 'finance_accounts.id', '=', 'expenses.paid_from_account_id')
            ->where('approval_status', 'approved')
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw('expenses.property_id, COALESCE(finance_accounts.currency_code, "AFN") as currency_code, COALESCE(SUM(expenses.amount), 0) as total')
            ->groupBy('expenses.property_id', 'currency_code')
            ->get()
            ->groupBy('property_id')
            ->map(fn (Collection $rows) => $rows->pluck('total', 'currency_code')->map(fn ($value) => (float) $value));

        return PropertyShareholding::query()
            ->with(['shareholder:id,full_name', 'property:id,name,name_translations'])
            ->effectiveDuring($startDate->toDateString(), $endDate->toDateString())
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->get()
            ->flatMap(function (PropertyShareholding $holding) use ($revenue, $expenses): array {
                $propertyRevenue = $revenue->get($holding->property_id, collect());
                $propertyExpenses = $expenses->get($holding->property_id, collect());
                $currencies = collect($propertyRevenue->keys())
                    ->merge($propertyExpenses->keys())
                    ->unique()
                    ->values();

                if ($currencies->isEmpty()) {
                    $currencies = collect(['AFN']);
                }

                return $currencies->map(function (string $currencyCode) use ($holding, $propertyRevenue, $propertyExpenses): array {
                    $propertyRevenueAmount = (float) ($propertyRevenue[$currencyCode] ?? 0);
                    $propertyExpensesAmount = (float) ($propertyExpenses[$currencyCode] ?? 0);
                    $net = $propertyRevenueAmount - $propertyExpensesAmount;

                    return [
                        'id' => $holding->id,
                        'shareholder' => $holding->shareholder?->full_name ?? '-',
                        'property' => $holding->property?->name ?? '-',
                        'percentage' => (float) $holding->percentage,
                        'currencyCode' => strtoupper($currencyCode),
                        'revenue' => $propertyRevenueAmount,
                        'expenses' => $propertyExpensesAmount,
                        'net' => $net,
                        'allocated' => $holding->allocatedAmount($net),
                    ];
                })->all();
            });
    }
}
