<?php

namespace App\Console\Commands;

use App\Services\Projection\BranchDailyMetricBackfillService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RefreshRecentBranchDailyMetricsCommand extends Command
{
    protected $signature = 'projection:refresh-recent-branch-daily-metrics
        {--hours=36 : Rebuild the recent projection window in hours}
        {--branch-id= : Limit refresh to a single branch}';

    protected $description = 'Refresh branch daily metric projections for a recent rolling time window.';

    public function handle(BranchDailyMetricBackfillService $service): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $branchId = $this->option('branch-id') !== null
            ? (int) $this->option('branch-id')
            : null;

        $startDate = Carbon::now()->subHours($hours)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $count = $service->backfill($startDate, $endDate, $branchId, false);

        $this->info("Refreshed {$count} branch-day metric row(s) for the recent {$hours}-hour window.");

        return self::SUCCESS;
    }
}
