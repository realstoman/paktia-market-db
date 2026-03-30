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
    ],

    'retention' => [
        'idempotency_days' => (int) env('POS_RETENTION_IDEMPOTENCY_DAYS', 2),
        'sync_credentials_days' => (int) env('POS_RETENTION_SYNC_CREDENTIAL_DAYS', 90),
        'projection_days' => (int) env('POS_RETENTION_PROJECTION_DAYS', 400),
    ],
];
