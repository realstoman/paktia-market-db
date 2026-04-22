<?php

namespace App\Services\Projection;

use App\Enums\OrderStatus;
use App\Models\Branch;
use App\Models\BranchDailyMetric;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BranchDailyMetricBackfillService
{
    public function backfill(
        Carbon $startDate,
        Carbon $endDate,
        ?int $branchId = null,
        bool $reset = false,
    ): int {
        if ($branchId !== null) {
            Branch::query()->findOrFail($branchId);
        }

        if ($reset) {
            BranchDailyMetric::query()
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->whereBetween('metric_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->delete();
        }

        $metrics = collect();

        $orderRows = DB::table('orders')
            ->selectRaw('branch_id, DATE(created_at) as metric_date')
            ->selectRaw('COUNT(*) as orders_total')
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_orders_total", [OrderStatus::COMPLETED->value])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_orders_total", [OrderStatus::CANCELLED->value])
            ->selectRaw('COALESCE(SUM(total_amount), 0) as gross_sales_total')
            ->selectRaw("COALESCE(SUM(CASE WHEN status = ? AND (covered_by_type IS NULL OR covered_by_type != 'house') THEN total_amount ELSE 0 END), 0) as completed_sales_total", [OrderStatus::COMPLETED->value])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('created_at', [$startDate->copy()->startOfDay(), $endDate->copy()->endOfDay()])
            ->groupBy('branch_id', DB::raw('DATE(created_at)'))
            ->get();

        foreach ($orderRows as $row) {
            $key = "{$row->branch_id}:{$row->metric_date}";

            $metrics[$key] = [
                'branch_id' => (int) $row->branch_id,
                'metric_date' => (string) $row->metric_date,
                'orders_total' => (int) $row->orders_total,
                'completed_orders_total' => (int) $row->completed_orders_total,
                'cancelled_orders_total' => (int) $row->cancelled_orders_total,
                'gross_sales_total' => (float) $row->gross_sales_total,
                'completed_sales_total' => (float) $row->completed_sales_total,
                'expenses_total' => 0.0,
                'last_projected_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $expenseRows = DB::table('expenses')
            ->selectRaw('branch_id, DATE(expense_date) as metric_date')
            ->selectRaw('COALESCE(SUM(amount), 0) as expenses_total')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('approval_status', 'approved')
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->groupBy('branch_id', DB::raw('DATE(expense_date)'))
            ->get();

        foreach ($expenseRows as $row) {
            $key = "{$row->branch_id}:{$row->metric_date}";
            $existing = $metrics->get($key, [
                'branch_id' => (int) $row->branch_id,
                'metric_date' => (string) $row->metric_date,
                'orders_total' => 0,
                'completed_orders_total' => 0,
                'cancelled_orders_total' => 0,
                'gross_sales_total' => 0.0,
                'completed_sales_total' => 0.0,
                'expenses_total' => 0.0,
                'last_projected_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $existing['expenses_total'] = (float) $row->expenses_total;
            $existing['updated_at'] = now();
            $existing['last_projected_at'] = now();

            $metrics[$key] = $existing;
        }

        foreach ($metrics->chunk(500) as $chunk) {
            BranchDailyMetric::query()->upsert(
                $chunk->values()->all(),
                ['branch_id', 'metric_date'],
                [
                    'orders_total',
                    'completed_orders_total',
                    'cancelled_orders_total',
                    'gross_sales_total',
                    'completed_sales_total',
                    'expenses_total',
                    'last_projected_at',
                    'updated_at',
                ],
            );
        }

        return $metrics->count();
    }
}
