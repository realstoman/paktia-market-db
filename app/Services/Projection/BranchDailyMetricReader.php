<?php

namespace App\Services\Projection;

use App\Models\BranchDailyMetric;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class BranchDailyMetricReader
{
    public function sumCompletedSales(
        CarbonInterface $startDate,
        CarbonInterface $endDate,
        ?int $branchId = null,
    ): float {
        return (float) $this->queryRange($startDate, $endDate, $branchId)
            ->sum('completed_sales_total');
    }

    public function sumExpenses(
        CarbonInterface $startDate,
        CarbonInterface $endDate,
        ?int $branchId = null,
    ): float {
        return (float) $this->queryRange($startDate, $endDate, $branchId)
            ->sum('expenses_total');
    }

    public function sumCompletedOrders(
        CarbonInterface $startDate,
        CarbonInterface $endDate,
        ?int $branchId = null,
    ): int {
        return (int) $this->queryRange($startDate, $endDate, $branchId)
            ->sum('completed_orders_total');
    }

    public function trend(
        CarbonInterface $startDate,
        CarbonInterface $endDate,
        ?int $branchId = null,
    ): Collection {
        $rows = $this->queryRange($startDate, $endDate, $branchId)
            ->get()
            ->groupBy(fn (BranchDailyMetric $metric) => $metric->metric_date->toDateString());

        return collect(CarbonPeriod::create(
            $startDate->copy()->startOfDay(),
            $endDate->copy()->startOfDay(),
        ))->map(function (CarbonInterface $date) use ($rows) {
            $bucket = $date->toDateString();
            $metrics = $rows->get($bucket, collect());

            return [
                'date' => $bucket,
                'label' => $date->format('M d'),
                'sales' => (float) $metrics->sum('completed_sales_total'),
                'expenses' => (float) $metrics->sum('expenses_total'),
            ];
        });
    }

    public function monthlyNetProfit(
        CarbonInterface $startMonth,
        CarbonInterface $endMonth,
        ?int $branchId = null,
    ): array {
        $rows = $this->queryRange($startMonth, $endMonth, $branchId)
            ->get()
            ->groupBy(fn (BranchDailyMetric $metric) => $metric->metric_date->format('Y-m'));

        $months = [];
        $cursor = Carbon::parse($startMonth)->startOfMonth();
        $end = Carbon::parse($endMonth)->startOfMonth();

        while ($cursor->lte($end)) {
            $bucket = $cursor->format('Y-m');
            $metrics = $rows->get($bucket, collect());

            $months[] = [
                'month' => $cursor->format('M'),
                'label' => $cursor->format('F Y'),
                'sales' => (float) $metrics->sum('completed_sales_total'),
                'expenses' => (float) $metrics->sum('expenses_total'),
            ];

            $cursor = $cursor->copy()->addMonth();
        }

        return $months;
    }

    public function branchRevenue(
        CarbonInterface $startDate,
        CarbonInterface $endDate,
        ?int $branchId = null,
    ): Collection {
        return $this->queryRange($startDate, $endDate, $branchId)
            ->join('branches', 'branches.id', '=', 'branch_daily_metrics.branch_id')
            ->selectRaw('branches.name as branch, COALESCE(SUM(branch_daily_metrics.completed_sales_total), 0) as revenue')
            ->groupBy('branches.id', 'branches.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'branch' => $row->branch,
                'revenue' => (float) $row->revenue,
            ]);
    }

    private function queryRange(
        CarbonInterface $startDate,
        CarbonInterface $endDate,
        ?int $branchId = null,
    ) {
        return BranchDailyMetric::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('metric_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ]);
    }
}
