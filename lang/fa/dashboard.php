<?php

return [
    'inventory' => [
        'usable' => 'قابل استفاده',
        'fixed' => 'ثابت',
        'other' => 'سایر',
        'unassigned' => 'تخصیص‌نشده',
    ],
    'attention' => [
        'critical_projection_branches_title' => 'شعبات بحرانی پیش‌ بینی',
        'critical_projection_branches_detail' => 'پیش‌ بینی :count شعبه نیاز به بررسی دارد.',
        'projection_warnings_title' => 'هشدارهای پیش‌ بینی',
        'projection_warnings_detail' => ':count شعبه پیش‌ بینی کهنه یا هشدار دارد.',
        'out_of_stock_title' => 'اقلام ناموجود',
        'out_of_stock_detail' => ':count قلم در حال حاضر ناموجود است.',
        'low_stock_title' => 'اقلام کم‌موجود',
        'low_stock_detail' => ':count قلم پایین‌تر از حد آستانه موجودی است.',
        'cancellation_rate_title' => 'نرخ لغو افزایش یافته',
        'cancellation_rate_detail' => 'سفارش‌های لغوشده امروز :rate% است.',
        'vendor_balances_title' => 'مانده پرداختنی فروشندگان',
        'vendor_balances_detail' => 'جمع بدهی فروشندگان :amount افغانی است.',
    ],
    'notes' => [
        'net_profit_without_cogs' => 'فایده خالص = فروش - مصارف تا زمانی که ثبت قیمت تمام‌شده موجودی فعال شود.',
        'net_profit_with_cogs' => 'فایده خالص = فایده ناخالص - مصارف، بر اساس حرکات ثبت‌شده قیمت تمام‌شده موجودی.',
        'expenses' => 'مصارف = مجموع تمام مبالغ مصارف ثبت‌شده.',
        'cash_position' => 'وضعیت نقدی = فروش نقدی - مصارف نقدی + حرکات نقدی تأییدشده.',
    ],
    'projection' => [
        'branch_current' => 'پیش‌ بینی به‌روز است.',
        'branch_missing' => 'فعالیت تازه منبع وجود دارد اما هیچ پیش‌ بینیی ثبت نشده است.',
        'branch_critical' => 'پیش‌ بینی نسبت به فعالیت تازه منبع به‌گونه بحرانی عقب است.',
        'branch_warning' => 'پیش‌ بینی نسبت به فعالیت تازه منبع عقب است.',
        'branch_unavailable' => 'برای این شعبه هنوز داده پیش‌ بینی ثبت نشده است.',
        'overall_critical' => 'یک یا چند شعبه به‌گونه محسوس از فعالیت تازه منبع عقب هستند.',
        'overall_warning' => 'به‌روزرسانی‌های پیش‌ بینی برای بعضی شعبات با تأخیر همراه است.',
        'overall_unavailable' => 'داده پیش‌ بینی هنوز تولید نشده است.',
        'overall_healthy' => 'اطلاعات وضعیت سیستم برای شعبات فعال ارائه گردیده است.',
    ],
];
