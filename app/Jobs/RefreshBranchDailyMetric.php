<?php

namespace App\Jobs;

use App\Services\Projection\BranchDailyMetricProjector;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RefreshBranchDailyMetric implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $branchId,
        public readonly string $metricDate,
    ) {}

    public function handle(BranchDailyMetricProjector $projector): void
    {
        $projector->project($this->branchId, $this->metricDate);
    }
}
