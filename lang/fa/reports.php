<?php

return [
    'catalog' => [
        'inventory' => [
            'title' => 'گدام',
            'description' => 'سطح موجودی، ارزش و قابل‌دسترس بودن اجناس گدام.',
        ],
        'employees' => [
            'title' => 'کارمندان',
            'description' => 'نمای عمومی کارمندان و تقسیمات آنان در مارکیت‌ها.',
        ],
        'finance' => [
            'title' => 'مالی',
            'description' => 'فعالیت مصارف و حرکات نقدی.',
        ],
        'branches' => [
            'title' => 'مارکیت‌ها و جایدادها',
            'description' => 'پوشش کارمندان و گدام در هر مارکیت.',
        ],
        'users' => [
            'title' => 'کاربران',
            'description' => 'نمای عمومی حساب‌های داخلی و دسترسی‌ها.',
        ],
    ],
    'overview' => [
        'stock_items' => 'اجناس گدام',
        'stock_value' => 'ارزش گدام',
        'employees' => 'کارمندان',
        'active_employees' => 'کارمندان فعال',
        'approved_expenses' => 'مصارف منظورشده',
        'pending_approvals' => 'در انتظار منظوری',
        'branches' => 'مارکیت‌ها',
        'active_branches' => 'مارکیت‌های فعال',
        'accounts' => 'حساب‌ها',
        'active_accounts' => 'حساب‌های فعال',
    ],
    'reports' => [
        'inventory' => [
            'title' => 'گزارش گدام',
            'description' => 'سطح موجودی گدام و ارزش فعلی اجناس.',
        ],
        'employees' => [
            'title' => 'گزارش کارمندان',
            'description' => 'وضعیت کارمندان و تقسیمات آنان در مارکیت‌ها.',
        ],
        'finance' => [
            'title' => 'گزارش مالی',
            'description' => 'فعالیت مصارف برای دوره انتخاب‌شده.',
        ],
        'branches' => [
            'title' => 'گزارش مارکیت‌ها و جایدادها',
            'description' => 'پوشش کارمندان و گدام در هر مارکیت.',
        ],
        'users' => [
            'title' => 'گزارش کاربران',
            'description' => 'حساب‌های داخلی و دسترسی‌های تعیین‌شده.',
        ],
    ],
    'columns' => [
        'item' => 'جنس',
        'branch' => 'مارکیت',
        'quantity' => 'مقدار',
        'unit' => 'واحد',
        'value' => 'ارزش',
        'status' => 'وضعیت',
        'employee' => 'کارمند',
        'position' => 'وظیفه',
        'date' => 'تاریخ',
        'reference' => 'مرجع',
        'description' => 'توضیحات',
        'amount' => 'مبلغ',
        'employees' => 'کارمندان',
        'inventory' => 'اجناس گدام',
        'user' => 'کاربر',
        'email' => 'ایمیل',
        'roles' => 'صلاحیت‌ها',
    ],
    'status' => [
        'unassigned' => 'تعیین نشده',
        'out_of_stock' => 'در گدام موجود نیست',
        'low_stock' => 'موجودی کم',
        'available' => 'موجود',
        'active' => 'فعال',
        'inactive' => 'غیرفعال',
        'draft' => 'مسوده',
        'submitted' => 'ثبت‌شده',
        'approved' => 'منظورشده',
        'rejected' => 'ردشده',
    ],
    'summary' => [
        'stock_items' => 'اجناس گدام',
        'inventory_value' => 'ارزش گدام',
        'employees' => 'کارمندان',
        'active' => 'فعال',
        'expenses' => 'مصارف',
        'approved_amount' => 'مبلغ منظورشده',
        'branches' => 'مارکیت‌ها',
        'accounts' => 'حساب‌ها',
    ],
    'export' => [
        'note' => 'از ریکاردهای فعلی مارکیت‌های پکتیاوال گروپ ساخته شده است.',
        'queued_title' => 'صادرکردن گزارش در صف قرار گرفت',
        'queued_description' => 'گزارش :filename در حال آماده‌شدن است. پس از آماده‌شدن، می‌توانید آن را از صفحه گزارش‌ها دانلود کنید.',
    ],
    'period' => [
        'range' => ':start تا :end',
    ],
    'reference' => [
        'expense' => 'مصرف #:id',
    ],
];
