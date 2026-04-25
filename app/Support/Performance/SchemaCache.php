<?php

namespace App\Support\Performance;

use Illuminate\Support\Facades\Schema;

/**
 * Tiny per-process memoizer around Schema::hasTable() so request-scoped
 * code (e.g. Inertia shared data, branding service) stops triggering
 * information_schema queries for tables that exist in production.
 *
 * Tests use RefreshDatabase, which drops and recreates tables between
 * cases, so the cache is reset automatically when the application
 * container is rebuilt.
 */
class SchemaCache
{
    /**
     * @var array<string, bool>
     */
    private static array $tableExists = [];

    public static function hasTable(string $table): bool
    {
        if (! array_key_exists($table, self::$tableExists)) {
            self::$tableExists[$table] = Schema::hasTable($table);
        }

        return self::$tableExists[$table];
    }

    public static function flush(): void
    {
        self::$tableExists = [];
    }
}
