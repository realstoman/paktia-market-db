<?php

return [
    'cookie_name' => env('CUSTOMER_SESSION_COOKIE', 'paktia_market_customer_session'),
    'ttl_minutes' => (int) env('CUSTOMER_SESSION_TTL', 60 * 24 * 30),
    'domain' => env('CUSTOMER_SESSION_DOMAIN', env('SESSION_DOMAIN')),
    'secure' => env('CUSTOMER_SESSION_SECURE', env('SESSION_SECURE_COOKIE', true)),
    'same_site' => env('CUSTOMER_SESSION_SAME_SITE', 'lax'),
];
