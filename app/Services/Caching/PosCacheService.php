<?php

namespace App\Services\Caching;

use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class PosCacheService
{
    /**
     * Per-process cache of the version counter for each namespace.
     * scopedKey() reads this on every cache hit; without memoization
     * each read triggers an extra driver round-trip.
     *
     * @var array<string, int>
     */
    private array $versionMemo = [];

    public function remember(string $namespace, array $segments, int $ttlSeconds, Closure $callback): mixed
    {
        return $this->store()->remember(
            $this->scopedKey($namespace, $segments),
            now()->addSeconds($ttlSeconds),
            $callback,
        );
    }

    public function invalidate(string $namespace): void
    {
        $versionKey = $this->versionKey($namespace);
        $store = $this->store();

        $next = $store->add($versionKey, 1, now()->addYear())
            ? 1
            : (int) $store->increment($versionKey);

        // Keep the in-process memo aligned with the bump so the next
        // read in this request resolves to the new version without an
        // extra driver round-trip.
        $this->versionMemo[$namespace] = $next;
    }

    public function forget(string $key): void
    {
        $this->store()->forget($key);
    }

    public function rawRemember(string $key, int $ttlSeconds, Closure $callback): mixed
    {
        return $this->store()->remember(
            $key,
            now()->addSeconds($ttlSeconds),
            $callback,
        );
    }

    private function scopedKey(string $namespace, array $segments): string
    {
        $version = $this->resolveVersion($namespace);

        return implode(':', [
            'pos-cache',
            $namespace,
            "v{$version}",
            ...array_map(static fn (mixed $segment) => (string) $segment, $segments),
        ]);
    }

    private function resolveVersion(string $namespace): int
    {
        if (! isset($this->versionMemo[$namespace])) {
            $this->versionMemo[$namespace] = (int) $this->store()->rememberForever(
                $this->versionKey($namespace),
                fn () => 1,
            );
        }

        return $this->versionMemo[$namespace];
    }

    private function versionKey(string $namespace): string
    {
        return "pos-cache-version:{$namespace}";
    }

    private function store(): Repository
    {
        return Cache::store(config('pos.cache.store'));
    }
}
