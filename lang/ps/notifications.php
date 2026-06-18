<?php

return [
    'flash' => [
        'title' => 'د سیستم فعالیت',
    ],
    'orders' => [
        'title' => 'نوی امر ترلاسه شو',
        'description' => 'امر #:id:table:user جوړ شو.',
        'table_segment' => ' د مېز :table لپاره',
        'user_segment' => ' د :user لخوا',
        'total_meta' => 'ټول :amount',
    ],
    'payments' => [
        'title' => 'تادیه ثبت شوه',
        'description' => ':method تادیه:order:user په بریالیتوب سره ثبت شوه.',
        'method_fallback' => 'تادیه',
        'order_segment' => ' د امر #:order لپاره',
        'user_segment' => ' د :user لخوا',
    ],
    'salary' => [
        'title' => 'د معاش فعالیت تازه شو',
        'description' => 'د معاش دوره #:id د :count کارکوونکو لپاره اوس :status ده.',
    ],
    'employees' => [
        'title' => 'نوی کارکوونکی اضافه شو',
        'description' => ':name له ټیم سره یوځای شو.',
    ],
    'users' => [
        'title' => 'نوی کارن حساب جوړ شو',
        'description' => ':name پلاتفورم ته اضافه شو.',
    ],
    'inventory' => [
        'added_title' => 'د ذخیرې توکی اضافه شو',
        'updated_title' => 'د ذخیرې توکی تازه شو',
        'added_description' => ':name ذخیرې ته اضافه شو.',
        'updated_description' => 'د :name د ذخیرې جزئیات تازه شول.',
        'qty_meta' => 'شمېر :quantity',
    ],
    'generated' => [
        'inventory_unavailable_title' => 'توکی په ګدام کې نشته',
        'low_inventory_title' => 'د ګدام موجودي کمه ده',
        'inventory_remaining_description' => 'د :name لپاره :quantity پاتې دي.',
        'expense_review_title' => 'لګښت کتنې ته اړتیا لري',
        'expense_review_description' => 'د :title لګښت د منظورۍ په تمه دی.',
        'payroll_recorded_title' => 'د معاش تادیه ثبت شوه',
        'payroll_recorded_description' => 'د :name معاش ثبت شو.',
        'payroll_recorded_fallback' => 'د کارکوونکي معاش ثبت شو.',
    ],
    'products' => [
        'added_title' => 'محصول اضافه شو',
        'updated_title' => 'محصول تازه شو',
        'added_description' => ':name اوس په کټلاګ کې شتون لري.',
        'updated_description' => 'د :name د محصول جزئیات تازه شول.',
    ],
];
