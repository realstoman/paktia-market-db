<?php

namespace App\Services\Caching;

use App\Models\Property;

class CatalogCacheService
{
    public const TOOL_REFERENCE_NAMESPACE = 'tool-reference';

    public function __construct(private readonly PosCacheService $cache) {}

    public function rememberToolReference(callable $callback): array
    {
        return $this->cache->remember(
            self::TOOL_REFERENCE_NAMESPACE,
            ['all'],
            config('pos.cache.ttl_seconds.tool_reference', 300),
            $callback(...),
        );
    }

    public function invalidateProperty(?Property $property = null): void
    {
        $this->cache->invalidate(self::TOOL_REFERENCE_NAMESPACE);
    }

    public function invalidateReferenceData(): void
    {
        $this->cache->invalidate(self::TOOL_REFERENCE_NAMESPACE);
    }
}
