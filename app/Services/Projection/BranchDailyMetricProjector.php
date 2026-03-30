<?php

namespace App\Services\Projection;

use App\Enums\OrderStatus;
use App\Models\BranchDailyMetric;
use Illuminate\Support\Facades\DB;

class BranchDailyMetricProjector
{
    public function project(int $branchId, string $metricDate): void
    {
        $orderMetrics = DB::table('orders')
            ->where('branch_id', $branchId)
            ->whereDate('created_at', $metricDate)
            ->selectRaw('COUNT(*) as orders_total')
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_orders_total", [OrderStatus::COMPLETED->value])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_orders_total", [OrderStatus::CANCELLED->value])
            ->selectRaw('COALESCE(SUM(total_amount), 0) as gross_sales_total')
            ->selectRaw("COALESCE(SUM(CASE WHEN status = ? THEN total_amount ELSE 0 END), 0) as completed_sales_total", [OrderStatus::COMPLETED->value])
            ->first();

        $expensesTotal = DB::table('expenses')
            ->where('branch_id', $branchId)
            ->whereDate('expense_date', $metricDate)
            ->sum('amount');

        BranchDailyMetric::query()->updateOrCreate(
            [
                'branch_id' => $branchId,
                'metric_date' => $metricDate,
            ],
            [
                'orders_total' => (int) ($orderMetrics->orders_total ?? 0),
                'completed_orders_total' => (int) ($orderMetrics->completed_orders_total ?? 0),
                'cancelled_orders_total' => (int) ($orderMetrics->cancelled_orders_total ?? 0),
                'gross_sales_total' => (float) ($orderMetrics->gross_sales_total ?? 0),
                'completed_sales_total' => (float) ($orderMetrics->completed_sales_total ?? 0),
                'expenses_total' => (float) $expensesTotal,
                'last_projected_at' => now(),
            ],
        );
    }
}
