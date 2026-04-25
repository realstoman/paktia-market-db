<?php

return [
    'cache' => [
        'store' => env('POS_CACHE_STORE', env('CACHE_STORE', 'database')),
        'ttl_seconds' => [
            'tool_reference' => (int) env('POS_CACHE_TOOL_REFERENCE_TTL', 300),
            'product_categories' => (int) env('POS_CACHE_PRODUCT_CATEGORIES_TTL', 300),
            'product_types' => (int) env('POS_CACHE_PRODUCT_TYPES_TTL', 300),
        ],
    ],

    'sync' => [
        'credential_ttl_hours' => (int) env('POS_SYNC_CREDENTIAL_TTL_HOURS', 720),
        // Minimum seconds between two consecutive last_used_at refreshes for
        // a branch-sync credential. Reduces DB writes on hot health-check
        // endpoints while still surfacing recent activity.
        'last_used_throttle_seconds' => (int) env('POS_SYNC_LAST_USED_THROTTLE_SECONDS', 60),
        // Minimum allowed length of the plain text token. Tokens shorter
        // than this are rejected without touching the database.
        'min_token_length' => (int) env('POS_SYNC_MIN_TOKEN_LENGTH', 40),
        // Whether the credential service is allowed to issue tokens with the
        // wildcard ('*') ability. Default false; flip to true (or pass the
        // explicit allowWildcard flag) only for one-off seeding.
        'allow_wildcard_ability' => (bool) env('POS_SYNC_ALLOW_WILDCARD_ABILITY', false),
    ],

    'projection' => [
        'health' => [
            'stale_after_minutes' => (int) env('POS_PROJECTION_STALE_AFTER_MINUTES', 30),
            'critical_after_minutes' => (int) env('POS_PROJECTION_CRITICAL_AFTER_MINUTES', 120),
            'recent_activity_hours' => (int) env('POS_PROJECTION_RECENT_ACTIVITY_HOURS', 48),
        ],
    ],

    'runtime_health' => [
        'queue' => [
            'warning_pending_jobs' => (int) env('POS_RUNTIME_QUEUE_WARNING_PENDING_JOBS', 25),
            'critical_pending_jobs' => (int) env('POS_RUNTIME_QUEUE_CRITICAL_PENDING_JOBS', 100),
            'warning_failed_jobs' => (int) env('POS_RUNTIME_QUEUE_WARNING_FAILED_JOBS', 1),
            'critical_failed_jobs' => (int) env('POS_RUNTIME_QUEUE_CRITICAL_FAILED_JOBS', 5),
        ],
        'sync' => [
            'stale_after_hours' => (int) env('POS_RUNTIME_SYNC_STALE_AFTER_HOURS', 72),
        ],
        'recent_refresh' => [
            'warning_after_minutes' => (int) env('POS_RUNTIME_REFRESH_WARNING_AFTER_MINUTES', 60),
            'critical_after_minutes' => (int) env('POS_RUNTIME_REFRESH_CRITICAL_AFTER_MINUTES', 180),
        ],
    ],

    'retention' => [
        'idempotency_days' => (int) env('POS_RETENTION_IDEMPOTENCY_DAYS', 2),
        'sync_credentials_days' => (int) env('POS_RETENTION_SYNC_CREDENTIAL_DAYS', 90),
        'projection_days' => (int) env('POS_RETENTION_PROJECTION_DAYS', 400),
        'audit_days' => (int) env('POS_RETENTION_AUDIT_DAYS', 30),
        'audit_archive_disk' => env('POS_AUDIT_ARCHIVE_DISK', 'local'),
        'audit_archive_path' => env('POS_AUDIT_ARCHIVE_PATH', 'audit-archive'),
    ],

    'audit' => [
        // When true, audit log writes are dispatched to the "audit" queue and
        // require a queue worker to consume them. Leave false (default) to
        // persist synchronously, which is the safest choice without a worker.
        'use_queue' => (bool) env('POS_AUDIT_USE_QUEUE', false),
        'queue' => env('POS_AUDIT_QUEUE', 'audit'),
    ],

    'exports' => [
        // When true, /reports/export/{pdf,xlsx} dispatches the heavy
        // rendering to RenderReportExportJob and immediately redirects the
        // user with a flash notification linking to the eventual download.
        // Leave off until a queue worker (preferably Redis-backed) is in
        // place; otherwise sync remains the safest fallback.
        'async' => (bool) env('POS_EXPORTS_ASYNC', false),
        'queue' => env('POS_EXPORTS_QUEUE', 'default'),
        'disk' => env('POS_EXPORTS_DISK', 'local'),
        'path' => env('POS_EXPORTS_PATH', 'reports/exports'),
    ],
];
