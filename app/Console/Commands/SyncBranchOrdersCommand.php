<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Services\BranchSync\BranchOrderSyncService;
use Illuminate\Console\Command;

class SyncBranchOrdersCommand extends Command
{
    protected $signature = 'branch:sync-orders
        {--branch-id= : Local branch id to sync}
        {--dry-run : Preview the configured sync branch without remote calls}';

    protected $description = 'Run the first-pass two-way order sync between the branch-local server and the VPS.';

    public function handle(BranchOrderSyncService $service): int
    {
        $branchId = $this->option('branch-id') ?: config('pos.sync.remote_branch_id');

        if (! $branchId) {
            $this->error('Missing branch id. Pass --branch-id or set POS_SYNC_REMOTE_BRANCH_ID.');

            return self::FAILURE;
        }

        $branch = Branch::query()->find((int) $branchId);

        if (! $branch) {
            $this->error("Branch #{$branchId} was not found.");

            return self::FAILURE;
        }

        if ((bool) $this->option('dry-run')) {
            $this->info("Dry run ready for branch {$branch->name} (#{$branch->id}).");
            $this->line('Remote base URL: '.((string) config('pos.sync.remote_base_url') ?: '[not configured]'));
            $this->line('Remote branch token: '.((string) config('pos.sync.remote_branch_token') !== '' ? '[configured]' : '[not configured]'));

            return self::SUCCESS;
        }

        try {
            $result = $service->syncWithRemote($branch);
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Sync completed for {$branch->name}.");
        $this->line('Pushed local orders: '.$result['pushed']);
        $this->line('Pulled online orders: '.$result['pulled']);
        $this->line('Imported inbound orders: '.$result['imported_inbound']);
        $this->line('Skipped inbound orders: '.$result['skipped_inbound']);

        return self::SUCCESS;
    }
}
