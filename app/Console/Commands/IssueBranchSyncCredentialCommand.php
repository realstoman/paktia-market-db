<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Services\BranchSync\BranchSyncCredentialService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class IssueBranchSyncCredentialCommand extends Command
{
    protected $signature = 'branch:issue-sync-credential
        {branch_id : The branch id to bind to the credential}
        {name : A human-friendly name for the local branch server}
        {--ability=* : Optional ability list (defaults to read-only health.read)}
        {--ttl-hours= : Override the default token TTL in hours}
        {--allow-wildcard : Permit issuing a wildcard ("*") ability token}';

    protected $description = 'Issue a branch-scoped sync credential for a branch-local server.';

    public function handle(BranchSyncCredentialService $service): int
    {
        $branch = Branch::query()->findOrFail((int) $this->argument('branch_id'));
        $ttlHours = $this->option('ttl-hours');
        $expiresAt = $ttlHours !== null
            ? Carbon::now()->addHours((int) $ttlHours)
            : Carbon::now()->addHours((int) config('pos.sync.credential_ttl_hours', 720));

        try {
            $issued = $service->issue(
                $branch,
                (string) $this->argument('name'),
                $this->option('ability') ?: null,
                $expiresAt,
                (bool) $this->option('allow-wildcard'),
            );
        } catch (\InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Credential issued for branch {$branch->name} (#{$branch->id}).");
        $this->line('Token: '.$issued['plain_text_token']);
        $this->line('Abilities: '.implode(', ', $issued['credential']->abilities ?? []));
        $this->line('Expires at: '.$expiresAt->toDateTimeString());
        $this->line('Runtime health endpoint: '.url('/api/v1/branch-sync/runtime-health'));

        return self::SUCCESS;
    }
}
