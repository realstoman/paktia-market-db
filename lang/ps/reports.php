<?php

return [
    'catalog' => [
        'inventory' => [
            'title' => 'ګدام',
            'description' => 'د ګدام موجودي، ارزښت او شتون.',
        ],
        'employees' => [
            'title' => 'کارکوونکي',
            'description' => 'د کارکوونکو او مارکېټ وېش عمومي کتنه.',
        ],
        'finance' => [
            'title' => 'مالي',
            'description' => 'د لګښتونو او نغدي حرکتونو فعالیت.',
        ],
        'branches' => [
            'title' => 'مارکېټونه او جایدادونه',
            'description' => 'د هر مارکېټ د کارکوونکو او ګدام پوښښ.',
        ],
        'users' => [
            'title' => 'کارنان',
            'description' => 'د داخلي حسابونو او لاسرسي عمومي کتنه.',
        ],
    ],
    'overview' => [
        'stock_items' => 'د ګدام توکي',
        'stock_value' => 'د ګدام ارزښت',
        'employees' => 'کارکوونکي',
        'active_employees' => 'فعال کارکوونکي',
        'approved_expenses' => 'منظور شوي لګښتونه',
        'pending_approvals' => 'د منظورۍ په تمه',
        'branches' => 'مارکېټونه',
        'active_branches' => 'فعال مارکېټونه',
        'accounts' => 'حسابونه',
        'active_accounts' => 'فعال حسابونه',
    ],
    'reports' => [
        'inventory' => [
            'title' => 'د ګدام راپور',
            'description' => 'د ګدام موجودي او اوسنی ارزښت.',
        ],
        'employees' => [
            'title' => 'د کارکوونکو راپور',
            'description' => 'د کارکوونکو وضعیت او د مارکېټ وېش.',
        ],
        'finance' => [
            'title' => 'مالي راپور',
            'description' => 'د ټاکلې مودې د لګښتونو فعالیت.',
        ],
        'branches' => [
            'title' => 'د مارکېټونو او جایدادونو راپور',
            'description' => 'د هر مارکېټ د کارکوونکو او ګدام پوښښ.',
        ],
        'users' => [
            'title' => 'د کارنانو راپور',
            'description' => 'داخلي حسابونه او ټاکل شوی لاسرسی.',
        ],
    ],
    'columns' => [
        'item' => 'توکی',
        'branch' => 'مارکېټ',
        'quantity' => 'مقدار',
        'unit' => 'واحد',
        'value' => 'ارزښت',
        'status' => 'وضعیت',
        'employee' => 'کارکوونکی',
        'position' => 'دنده',
        'date' => 'نېټه',
        'reference' => 'مرجع',
        'description' => 'تشریح',
        'amount' => 'مبلغ',
        'employees' => 'کارکوونکي',
        'inventory' => 'د ګدام توکي',
        'user' => 'کارن',
        'email' => 'ایمیل',
        'roles' => 'صلاحیتونه',
    ],
    'status' => [
        'unassigned' => 'نه دی ټاکل شوی',
        'out_of_stock' => 'په ګدام کې نشته',
        'low_stock' => 'موجودي کمه ده',
        'available' => 'شته',
        'active' => 'فعال',
        'inactive' => 'غیرفعال',
        'draft' => 'مسوده',
        'submitted' => 'سپارل شوی',
        'approved' => 'منظور شوی',
        'rejected' => 'رد شوی',
    ],
    'summary' => [
        'stock_items' => 'د ګدام توکي',
        'inventory_value' => 'د ګدام ارزښت',
        'employees' => 'کارکوونکي',
        'active' => 'فعال',
        'expenses' => 'لګښتونه',
        'approved_amount' => 'منظور شوی مبلغ',
        'branches' => 'مارکېټونه',
        'accounts' => 'حسابونه',
    ],
    'export' => [
        'note' => 'د پکتیاوال گروپ د اوسنیو مارکېټ ریکارډونو څخه جوړ شوی.',
        'queued_title' => 'د راپور صادرول په کتار کې شو',
        'queued_description' => ':filename چمتو کېږي. کله چې چمتو شي، د راپورونو له پاڼې یې ډاونلوډ کولای شئ.',
    ],
    'period' => [
        'range' => ':start تر :end',
    ],
    'reference' => [
        'expense' => 'لګښت #:id',
    ],
];
