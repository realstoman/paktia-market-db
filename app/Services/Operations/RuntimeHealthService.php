<?php

namespace App\Services\Operations;

use App\Models\BranchSyncCredential;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Schema;
use Throwable;

class RuntimeHealthService
{
    public const RECENT_REFRESH_CACHE_KEY = 'operations:runtime-health:recent-refresh:last-successful-at';

    public function snapshot(): array
    {
        $queue = $this->queueSnapshot();
        $redis = $this->redisSnapshot();
        $sync = $this->branchSyncSnapshot();
        $recentRefresh = $this->recentRefreshSnapshot();

        $components = [
            'queue' => $queue,
            'redis' => $redis,
            'sync' => $sync,
            'recentRefresh' => $recentRefresh,
        ];

        return [
            'status' => $this->highestStatus(array_column($components, 'status')),
            'message' => $this->overallMessage($components),
            'components' => $components,
        ];
    }

    public static function markRecentRefreshSuccess(?Carbon $timestamp = null): void
    {
        $store = (string) config('pos.cache.store', config('cache.default'));

        Cache::store($store)->forever(
            self::RECENT_REFRESH_CACHE_KEY,
            ($timestamp ?? now())->toIso8601String(),
        );
    }

    private function queueSnapshot(): array
    {
        $connectionName = (string) config('queue.default', 'sync');
        $connectionConfig = (array) config("queue.connections.{$connectionName}", []);
        $driver = (string) ($connectionConfig['driver'] ?? $connectionName);
        $queueName = (string) ($connectionConfig['queue'] ?? 'default');

        $pendingJobs = null;
        $failedJobs = null;
        $latestFailedAt = null;
        $oldestPendingAt = null;
        $status = 'healthy';
        $message = 'Queue connection is reachable and backlog is within threshold.';

        try {
            $pendingJobs = Queue::connection($connectionName)->size($queueName);
        } catch (Throwable $exception) {
            $status = 'critical';
            $message = 'Queue connection is not reachable from the application.';
        }

        if (Schema::hasTable('jobs')) {
            $jobsQuery = DB::table('jobs');

            if ($driver === 'database') {
                $jobsQuery->where('queue', $queueName);
            }

            $pendingJobs = $pendingJobs ?? (int) $jobsQuery->count();
            $oldestPendingTimestamp = $jobsQuery->min('available_at');

            if ($oldestPendingTimestamp) {
                $oldestPendingAt = Carbon::createFromTimestamp((int) $oldestPendingTimestamp)->toIso8601String();
            }
        }

        if (Schema::hasTable('failed_jobs')) {
            $failedJobs = (int) DB::table('failed_jobs')->count();

            if (Schema::hasColumn('failed_jobs', 'failed_at')) {
                $failedAtValue = DB::table('failed_jobs')->max('failed_at');

                if ($failedAtValue) {
                    $latestFailedAt = Carbon::parse((string) $failedAtValue)->toIso8601String();
                }
            }
        }

        $warningPendingJobs = (int) config('pos.runtime_health.queue.warning_pending_jobs', 25);
        $criticalPendingJobs = (int) config('pos.runtime_health.queue.critical_pending_jobs', 100);
        $warningFailedJobs = (int) config('pos.runtime_health.queue.warning_failed_jobs', 1);
        $criticalFailedJobs = (int) config('pos.runtime_health.queue.critical_failed_jobs', 5);

        if ($status !== 'critical') {
            if ($driver === 'sync') {
                $status = 'warning';
                $message = 'Queue is running in sync mode, which limits retry and buffering resilience.';
            } elseif (($failedJobs ?? 0) >= $criticalFailedJobs || ($pendingJobs ?? 0) >= $criticalPendingJobs) {
                $status = 'critical';
                $message = 'Queue backlog or failed jobs are above the critical threshold.';
            } elseif (($failedJobs ?? 0) >= $warningFailedJobs || ($pendingJobs ?? 0) >= $warningPendingJobs) {
                $status = 'warning';
                $message = 'Queue backlog or failed jobs are above the warning threshold.';
            }
        }

        return [
            'status' => $status,
            'message' => $message,
            'connection' => $connectionName,
            'driver' => $driver,
            'queue' => $queueName,
            'pendingJobs' => $pendingJobs,
            'failedJobs' => $failedJobs,
            'oldestPendingAt' => $oldestPendingAt,
            'latestFailedAt' => $latestFailedAt,
        ];
    }

    private function redisSnapshot(): array
    {
        $cacheStore = (string) config('cache.default', 'database');
        $posCacheStore = (string) config('pos.cache.store', $cacheStore);
        $queueConnection = (string) config('queue.default', 'sync');
        $queueDriver = (string) config("queue.connections.{$queueConnection}.driver", $queueConnection);

        $redisExpected = in_array($posCacheStore, ['redis', 'failover'], true)
            || in_array($cacheStore, ['redis', 'failover'], true)
            || in_array($queueDriver, ['redis', 'failover'], true);

        if (! $redisExpected) {
            return [
                'status' => 'warning',
                'message' => 'Redis is not configured as an active cache or queue dependency yet.',
                'cacheStore' => $cacheStore,
                'posCacheStore' => $posCacheStore,
                'queueConnection' => $queueConnection,
                'queueDriver' => $queueDriver,
                'latencyMs' => null,
            ];
        }

        try {
            $startedAt = microtime(true);
            $response = Redis::connection()->ping();
            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            $isHealthy = is_string($response)
                ? str_contains(strtolower($response), 'pong')
                : (bool) $response;

            return [
                'status' => $isHealthy ? 'healthy' : 'critical',
                'message' => $isHealthy
                    ? 'Redis responded to a health check ping.'
                    : 'Redis did not return a healthy ping response.',
                'cacheStore' => $cacheStore,
                'posCacheStore' => $posCacheStore,
                'queueConnection' => $queueConnection,
                'queueDriver' => $queueDriver,
                'latencyMs' => $latencyMs,
            ];
        } catch (Throwable $exception) {
            return [
                'status' => 'critical',
                'message' => 'Redis is configured but not reachable from the application.',
                'cacheStore' => $cacheStore,
                'posCacheStore' => $posCacheStore,
                'queueConnection' => $queueConnection,
                'queueDriver' => $queueDriver,
                'latencyMs' => null,
            ];
        }
    }

    private function branchSyncSnapshot(): array
    {
        $staleAfterHours = (int) config('pos.runtime_health.sync.stale_after_hours', 72);
        $recentCutoff = now()->subHours($staleAfterHours);

        $activeCredentialsQuery = BranchSyncCredential::query()
            ->with('branch:id,name')
            ->whereNull('revoked_at')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });

        $activeCredentials = (clone $activeCredentialsQuery)->count();
        $recentlyUsedCredentials = (clone $activeCredentialsQuery)
            ->whereNotNull('last_used_at')
            ->where('last_used_at', '>=', $recentCutoff)
            ->count();
        $staleCredentials = max(0, $activeCredentials - $recentlyUsedCredentials);
        $revokedCredentials = (int) BranchSyncCredential::query()
            ->whereNotNull('revoked_at')
            ->count();
        $expiredCredentials = (int) BranchSyncCredential::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->count();
        $latestUsedAt = BranchSyncCredential::query()->max('last_used_at');

        $branches = (clone $activeCredentialsQuery)
            ->get()
            ->groupBy('branch_id')
            ->map(function ($credentials, $branchId) use ($recentCutoff) {
                $latestBranchUsage = $credentials
                    ->pluck('last_used_at')
                    ->filter()
                    ->sortDesc()
                    ->first();

                return [
                    'branchId' => (int) $branchId,
                    'branchName' => $credentials->first()?->branch?->name ?? "Branch {$branchId}",
                    'activeCredentialCount' => $credentials->count(),
                    'recentlyUsedCredentialCount' => $credentials
                        ->filter(fn (BranchSyncCredential $credential) => $credential->last_used_at && $credential->last_used_at->gte($recentCutoff))
                        ->count(),
                    'latestUsedAt' => $latestBranchUsage?->toIso8601String(),
                ];
            })
            ->sortBy('branchName')
            ->values()
            ->take(5)
            ->all();

        $status = 'healthy';
        $message = 'Branch sync credentials are active and have recent usage.';

        if ($activeCredentials === 0) {
            $status = 'warning';
            $message = 'No active branch sync credentials have been issued yet.';
        } elseif ($recentlyUsedCredentials === 0) {
            $status = 'warning';
            $message = 'Active branch sync credentials exist but none were used recently.';
        } elseif ($staleCredentials > 0) {
            $status = 'warning';
            $message = 'Some active branch sync credentials have not been used recently.';
        }

        return [
            'status' => $status,
            'message' => $message,
            'activeCredentials' => $activeCredentials,
            'recentlyUsedCredentials' => $recentlyUsedCredentials,
            'staleCredentials' => $staleCredentials,
            'revokedCredentials' => $revokedCredentials,
            'expiredCredentials' => $expiredCredentials,
            'latestUsedAt' => $latestUsedAt ? Carbon::parse((string) $latestUsedAt)->toIso8601String() : null,
            'branches' => $branches,
        ];
    }

    private function recentRefreshSnapshot(): array
    {
        $store = (string) config('pos.cache.store', config('cache.default'));
        $warningAfterMinutes = (int) config('pos.runtime_health.recent_refresh.warning_after_minutes', 60);
        $criticalAfterMinutes = (int) config('pos.runtime_health.recent_refresh.critical_after_minutes', 180);

        try {
            $rawTimestamp = Cache::store($store)->get(self::RECENT_REFRESH_CACHE_KEY);
        } catch (Throwable $exception) {
            return [
                'status' => 'critical',
                'message' => 'The recent projection refresh heartbeat could not be read from cache.',
                'lastSuccessfulAt' => null,
                'ageMinutes' => null,
            ];
        }

        if (! $rawTimestamp) {
            return [
                'status' => 'warning',
                'message' => 'The recent projection refresh heartbeat has not been recorded yet.',
                'lastSuccessfulAt' => null,
                'ageMinutes' => null,
            ];
        }

        $timestamp = Carbon::parse((string) $rawTimestamp);
        $ageMinutes = $timestamp->diffInMinutes(now());

        $status = 'healthy';
        $message = 'The recent projection refresh heartbeat is current.';

        if ($ageMinutes >= $criticalAfterMinutes) {
            $status = 'critical';
            $message = 'The recent projection refresh heartbeat is critically stale.';
        } elseif ($ageMinutes >= $warningAfterMinutes) {
            $status = 'warning';
            $message = 'The recent projection refresh heartbeat is delayed.';
        }

        return [
            'status' => $status,
            'message' => $message,
            'lastSuccessfulAt' => $timestamp->toIso8601String(),
            'ageMinutes' => $ageMinutes,
        ];
    }

    private function highestStatus(array $statuses): string
    {
        foreach (['critical', 'warning', 'unavailable', 'healthy'] as $status) {
            if (in_array($status, $statuses, true)) {
                return $status;
            }
        }

        return 'healthy';
    }

    private function overallMessage(array $components): string
    {
        $criticalComponents = collect($components)->filter(fn (array $component) => $component['status'] === 'critical')->keys()->values();

        if ($criticalComponents->isNotEmpty()) {
            return 'Critical runtime issues detected in '.implode(', ', $criticalComponents->all()).'.';
        }

        $warningComponents = collect($components)->filter(fn (array $component) => $component['status'] === 'warning')->keys()->values();

        if ($warningComponents->isNotEmpty()) {
            return 'Runtime attention needed for '.implode(', ', $warningComponents->all()).'.';
        }

        return 'Runtime services are healthy.';
    }
}
