<?php

namespace App\Console\Commands;

use App\Models\Property;
use App\Services\PropertySync\PropertySyncCredentialService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class IssuePropertySyncCredentialCommand extends Command
{
    protected $signature = 'property:issue-sync-credential
        {property_id : The property id to bind to the credential}
        {name : A human-friendly name for the local property server}
        {--ability=* : Optional ability list (defaults to read-only health.read)}
        {--ttl-hours= : Override the default token TTL in hours}
        {--allow-wildcard : Permit issuing a wildcard ("*") ability token}';

    protected $description = 'Issue a property-scoped sync credential for a property-local server.';

    public function handle(PropertySyncCredentialService $service): int
    {
        $property = Property::query()->findOrFail((int) $this->argument('property_id'));
        $ttlHours = $this->option('ttl-hours');
        $expiresAt = $ttlHours !== null
            ? Carbon::now()->addHours((int) $ttlHours)
            : Carbon::now()->addHours((int) config('pos.sync.credential_ttl_hours', 720));

        try {
            $issued = $service->issue(
                $property,
                (string) $this->argument('name'),
                $this->option('ability') ?: null,
                $expiresAt,
                (bool) $this->option('allow-wildcard'),
            );
        } catch (\InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Credential issued for property {$property->name} (#{$property->id}).");
        $this->line('Token: '.$issued['plain_text_token']);
        $this->line('Abilities: '.implode(', ', $issued['credential']->abilities ?? []));
        $this->line('Expires at: '.$expiresAt->toDateTimeString());
        $this->line('Runtime health endpoint: '.url('/api/v1/property-sync/runtime-health'));

        return self::SUCCESS;
    }
}
