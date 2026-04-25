<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HTTP security headers
    |--------------------------------------------------------------------------
    |
    | These values are applied by SetSecurityHeaders middleware. Set a value
    | to an empty string or null to disable a header without removing it from
    | the array (so other deployments can keep it on).
    |
    */
    'headers' => [
        'x_content_type_options' => env('SECURITY_X_CONTENT_TYPE_OPTIONS', 'nosniff'),
        'x_frame_options' => env('SECURITY_X_FRAME_OPTIONS', 'SAMEORIGIN'),
        'referrer_policy' => env('SECURITY_REFERRER_POLICY', 'strict-origin-when-cross-origin'),
        'permissions_policy' => env(
            'SECURITY_PERMISSIONS_POLICY',
            'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        ),
        'cross_origin_opener_policy' => env('SECURITY_COOP', 'same-origin'),
        'cross_origin_resource_policy' => env('SECURITY_CORP', 'same-site'),

        // HSTS — only sent on HTTPS responses. Defaults to one year +
        // includeSubDomains. Enable preload only after the domain has been
        // submitted to the HSTS preload list.
        'hsts_enabled' => (bool) env('SECURITY_HSTS_ENABLED', true),
        'hsts_max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31_536_000),
        'hsts_include_subdomains' => (bool) env('SECURITY_HSTS_INCLUDE_SUBDOMAINS', true),
        'hsts_preload' => (bool) env('SECURITY_HSTS_PRELOAD', false),

        // Optional Content Security Policy. Leave empty to skip; tune per
        // deployment. Inertia + Vite typically need 'self' plus the dev
        // server during local development, so this is intentionally opt-in.
        'content_security_policy' => env('SECURITY_CSP'),
    ],
];
