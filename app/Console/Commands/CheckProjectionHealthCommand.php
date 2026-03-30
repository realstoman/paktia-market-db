<?php

namespace App\Console\Commands;

use App\Services\Projection\ProjectionHealthService;
use Illuminate\Console\Command;

class CheckProjectionHealthCommand extends Command
{
    protected $signature = 'projection:health-check {--json : Output the health snapshot as JSON}';

    protected $description = 'Check whether projection data is fresh enough for operational dashboards.';

    public function handle(ProjectionHealthService $healthService): int
    {
        $snapshot = $healthService->snapshot();

        if ($this->option('json')) {
            $this->line(json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->info('Projection health: '.$snapshot['status']);
            $this->line($snapshot['message']);
            $this->line('Stale branches: '.(string) $snapshot['staleBranchCount']);

            foreach ($snapshot['branches'] as $branch) {
                $this->line(sprintf(
                    '- %s [%s] %s',
                    $branch['branchName'],
                    $branch['status'],
                    $branch['message'],
                ));
            }
        }

        return $snapshot['status'] === 'critical'
            ? self::FAILURE
            : self::SUCCESS;
    }
}
