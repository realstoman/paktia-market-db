<?php

return [
    'flash' => [
        'title' => 'فعالیت سیستم',
    ],
    'orders' => [
        'title' => 'سفارش جدید دریافت شد',
        'description' => 'سفارش #:id:table:user ایجاد شد.',
        'table_segment' => ' برای میز :table',
        'user_segment' => ' توسط :user',
        'total_meta' => 'مجموع :amount',
    ],
    'payments' => [
        'title' => 'پرداخت ثبت شد',
        'description' => 'پرداخت :method:order:user با موفقیت ثبت شد.',
        'method_fallback' => 'پرداخت',
        'order_segment' => ' برای سفارش #:order',
        'user_segment' => ' توسط :user',
    ],
    'salary' => [
        'title' => 'فعالیت معاش به‌روزرسانی شد',
        'description' => 'دوره معاش #:id برای :count کارمند در وضعیت :status قرار دارد.',
    ],
    'employees' => [
        'title' => 'کارمند جدید اضافه شد',
        'description' => ':name به تیم پیوست.',
    ],
    'users' => [
        'title' => 'حساب کاربری جدید ایجاد شد',
        'description' => ':name به پلتفرم اضافه شد.',
    ],
    'inventory' => [
        'added_title' => 'آیتم موجودی اضافه شد',
        'updated_title' => 'آیتم موجودی به‌روزرسانی شد',
        'added_description' => ':name به موجودی اضافه شد.',
        'updated_description' => 'جزئیات موجودی :name به‌روزرسانی شد.',
        'qty_meta' => 'مقدار :quantity',
    ],
    'products' => [
        'added_title' => 'محصول اضافه شد',
        'updated_title' => 'محصول به‌روزرسانی شد',
        'added_description' => ':name اکنون در کاتالوگ موجود است.',
        'updated_description' => 'جزئیات محصول :name به‌روزرسانی شد.',
    ],
];
