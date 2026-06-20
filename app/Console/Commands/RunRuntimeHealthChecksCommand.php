<?php

namespace App\Console\Commands;

use App\Services\Operations\RuntimeHealthService;
use Illuminate\Console\Command;

class RunRuntimeHealthChecksCommand extends Command
{
    protected $signature = 'pos:runtime-health-check';

    protected $description = 'Run application-managed runtime health checks and record a successful heartbeat.';

    public function handle(RuntimeHealthService $runtimeHealthService): int
    {
        $snapshot = $runtimeHealthService->runChecks();

        $this->info('Runtime health checks completed with status: '.$snapshot['status']);

        return self::SUCCESS;
    }
}
