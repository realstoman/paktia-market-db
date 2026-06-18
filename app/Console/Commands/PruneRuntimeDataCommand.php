<?php

namespace App\Console\Commands;

use App\Models\PropertySyncCredential;
use App\Models\IdempotencyRequest;
use App\Services\Caching\PosCacheService;
use Illuminate\Console\Command;

class PruneRuntimeDataCommand extends Command
{
    protected $signature = 'pos:prune-runtime-data';

    protected $description = 'Prune expired runtime records such as idempotency requests and sync credentials.';

    public function handle(PosCacheService $cache): int
    {
        $idempotencyDeleted = IdempotencyRequest::query()
            ->where(function ($query) {
                $query->whereNotNull('expires_at')
                    ->where('expires_at', '<', now());
            })
            ->orWhere('created_at', '<', now()->subDays((int) config('pos.retention.idempotency_days', 2)))
            ->delete();

        $credentialsDeleted = PropertySyncCredential::query()
            ->where(function ($query) {
                $query->whereNotNull('revoked_at')
                    ->where('revoked_at', '<', now()->subDays((int) config('pos.retention.sync_credentials_days', 90)));
            })
            ->orWhere(function ($query) {
                $query->whereNotNull('expires_at')
                    ->where('expires_at', '<', now()->subDays(1));
            })
            ->delete();

        $cache->forget('tool-reference-data.v1');

        $this->info("Deleted {$idempotencyDeleted} expired idempotency records.");
        $this->info("Deleted {$credentialsDeleted} expired or revoked property sync credentials.");

        return self::SUCCESS;
    }
}
