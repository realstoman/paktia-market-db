<?php

namespace App\Services\Projection;

use App\Jobs\RefreshBranchDailyMetric;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class ProjectionDispatchService
{
    public function queueBranchDailyMetric(?int $branchId, CarbonInterface|string|null $metricDate): void
    {
        if (! $branchId || ! $metricDate) {
            return;
        }

        $date = $metricDate instanceof CarbonInterface
            ? $metricDate->toDateString()
            : (string) $metricDate;

        DB::afterCommit(fn () => RefreshBranchDailyMetric::dispatch($branchId, $date));
    }
}
