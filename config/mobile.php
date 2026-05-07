<?php

return [
    'apps' => [
        [
            'key' => env('MOBILE_APP_KEY_IOS'),
            'platform' => 'ios',
            'active' => true,
        ],
        [
            'key' => env('MOBILE_APP_KEY_ANDROID'),
            'platform' => 'android',
            'active' => true,
        ],
    ],

    'guest' => [
        'expires_in_days' => (int) env('MOBILE_GUEST_EXPIRES_IN_DAYS', 30),
    ],

    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        'keys_url' => env(
            'FIREBASE_KEYS_URL',
            'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
        ),
        'keys_cache_seconds' => (int) env('FIREBASE_KEYS_CACHE_SECONDS', 3600),
        'stub_mode' => (bool) env('MOBILE_FIREBASE_STUB_MODE', false),
    ],
];
