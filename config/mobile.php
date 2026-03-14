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
        'stub_mode' => (bool) env('MOBILE_FIREBASE_STUB_MODE', false),
    ],
];
