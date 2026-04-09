<?php

return [
    'inventory' => [
        'usable' => 'Usable',
        'fixed' => 'Fixed',
        'other' => 'Other',
        'unassigned' => 'Unassigned',
    ],
    'attention' => [
        'critical_projection_branches_title' => 'Critical projection branches',
        'critical_projection_branches_detail' => ':count branch projections need review.',
        'projection_warnings_title' => 'Projection warnings',
        'projection_warnings_detail' => ':count branches have stale or warning projections.',
        'out_of_stock_title' => 'Out-of-stock inventory',
        'out_of_stock_detail' => ':count items are currently unavailable.',
        'low_stock_title' => 'Low-stock inventory',
        'low_stock_detail' => ':count items are running below the stock threshold.',
        'cancellation_rate_title' => 'Cancellation rate elevated',
        'cancellation_rate_detail' => 'Cancelled orders are at :rate% today.',
        'vendor_balances_title' => 'Vendor balances pending',
        'vendor_balances_detail' => 'Outstanding vendor payables total :amount AFN.',
    ],
    'notes' => [
        'net_profit_without_cogs' => 'Net profit = sales - expenses until inventory cost postings are active.',
        'net_profit_with_cogs' => 'Net profit = gross profit - expenses, using posted inventory cost movements.',
        'expenses' => 'Expenses = sum of all recorded expense amounts.',
        'cash_position' => 'Cash position = cash sales - cash expenses + approved cash movements.',
    ],
];
