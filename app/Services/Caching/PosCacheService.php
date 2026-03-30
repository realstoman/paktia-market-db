<?php

namespace App\Services\Caching;

use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class PosCacheService
{
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

        if (! $store->add($versionKey, 1, now()->addYear())) {
            $store->increment($versionKey);
        }
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
        $version = $this->store()->rememberForever($this->versionKey($namespace), fn () => 1);

        return implode(':', [
            'pos-cache',
            $namespace,
            "v{$version}",
            ...array_map(static fn (mixed $segment) => (string) $segment, $segments),
        ]);
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
