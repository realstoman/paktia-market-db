<?php

return [
    'cookie_name' => env('APP_LOCALE_COOKIE', 'locale'),

    'supported' => [
        'en' => [
            'label' => 'English',
            'native_label' => 'English',
            'direction' => 'ltr',
            'is_default' => true,
        ],
        'fa' => [
            'label' => 'Dari',
            'native_label' => 'دری',
            'direction' => 'rtl',
            'is_default' => false,
        ],
        'ps' => [
            'label' => 'Pashto',
            'native_label' => 'پښتو',
            'direction' => 'rtl',
            'is_default' => false,
        ],
    ],
];
