<?php

namespace App\Services\Finance;

use App\Models\Lease;
use App\Models\RentPayment;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RentalFinanceService
{
    public function leases(Carbon $startDate, Carbon $endDate, ?int $propertyId = null): Collection
    {
        return Lease::query()
            ->with([
                'tenant:id,full_name,business_name,phone',
                'property:id,name,name_translations,property_type,external_unit_number',
                'floor:id,name,level_number',
                'unit:id,unit_number,unit_type,property_floor_id',
                'currency:id,code,symbol',
                'contractDocuments:id,lease_id',
            ])
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereIn('status', ['active', 'ended'])
            ->whereDate('start_date', '<=', $endDate->toDateString())
            ->where(fn ($query) => $query
                ->whereNull('end_date')
                ->orWhereDate('end_date', '>=', $startDate->toDateString()))
            ->orderBy('property_id')
            ->orderBy('contract_number')
            ->get();
    }

    public function expectedForLease(Lease $lease, Carbon $startDate, Carbon $endDate): float
    {
        if ($lease->rent_amount === null) {
            return 0.0;
        }

        return (float) $lease->rent_amount * $this->dueCount($lease, $startDate, $endDate);
    }

    public function summary(Carbon $startDate, Carbon $endDate, ?int $propertyId = null): array
    {
        $leases = $this->leases($startDate, $endDate, $propertyId);
        $expected = (float) $leases->sum(
            fn (Lease $lease) => $this->expectedForLease($lease, $startDate, $endDate),
        );
        $payments = RentPayment::query()
            ->where('status', 'received')
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereDate('period_start', '<=', $endDate->toDateString())
            ->where(fn ($query) => $query
                ->whereDate('period_end', '>=', $startDate->toDateString())
                ->orWhere(fn ($singlePeriod) => $singlePeriod
                    ->whereNull('period_end')
                    ->whereDate('period_start', '>=', $startDate->toDateString())));
        $received = (float) (clone $payments)->sum('amount');

        return [
            'expected' => $expected,
            'received' => $received,
            'outstanding' => max(0, $expected - $received),
            'activeLeases' => $leases->where('status', 'active')->count(),
            'signedContracts' => $leases->filter(fn (Lease $lease) => $lease->contractDocuments->isNotEmpty())->count(),
            'unsignedContracts' => $leases->filter(fn (Lease $lease) => $lease->contractDocuments->isEmpty())->count(),
        ];
    }

    public function leaseRows(Carbon $startDate, Carbon $endDate, ?int $propertyId = null): Collection
    {
        $payments = RentPayment::query()
            ->where('status', 'received')
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereDate('period_start', '<=', $endDate->toDateString())
            ->where(fn ($query) => $query
                ->whereDate('period_end', '>=', $startDate->toDateString())
                ->orWhere(fn ($singlePeriod) => $singlePeriod
                    ->whereNull('period_end')
                    ->whereDate('period_start', '>=', $startDate->toDateString())))
            ->selectRaw('lease_id, COALESCE(SUM(amount), 0) as total')
            ->groupBy('lease_id')
            ->pluck('total', 'lease_id');

        return $this->leases($startDate, $endDate, $propertyId)
            ->map(function (Lease $lease) use ($startDate, $endDate, $payments): array {
                $expected = $this->expectedForLease($lease, $startDate, $endDate);
                $received = (float) ($payments[$lease->id] ?? 0);

                return [
                    'lease' => $lease,
                    'expected' => $expected,
                    'received' => $received,
                    'outstanding' => max(0, $expected - $received),
                ];
            });
    }

    private function dueCount(Lease $lease, Carbon $startDate, Carbon $endDate): int
    {
        $leaseStart = Carbon::parse($lease->start_date)->startOfDay();
        $leaseEnd = $lease->end_date
            ? Carbon::parse($lease->end_date)->endOfDay()
            : $endDate->copy();
        $windowStart = $startDate->copy()->startOfDay();
        $windowEnd = $endDate->copy()->endOfDay()->min($leaseEnd);

        if ($leaseStart->greaterThan($windowEnd)) {
            return 0;
        }

        $months = match ($lease->payment_frequency) {
            'quarterly' => 3,
            'yearly' => 12,
            default => 1,
        };
        $due = $leaseStart->copy();
        while ($due->lessThan($windowStart)) {
            $due->addMonthsNoOverflow($months);
        }

        $count = 0;
        while ($due->lessThanOrEqualTo($windowEnd)) {
            $count++;
            $due->addMonthsNoOverflow($months);
        }

        return $count;
    }
}
