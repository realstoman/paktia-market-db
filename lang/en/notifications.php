<?php

return [
    'flash' => [
        'title' => 'System activity',
    ],
    'orders' => [
        'title' => 'New order received',
        'description' => 'Order #:id was created:table:user.',
        'table_segment' => ' for table :table',
        'user_segment' => ' by :user',
        'total_meta' => 'Total :amount',
    ],
    'payments' => [
        'title' => 'Payment recorded',
        'description' => ':method payment:order:user was posted successfully.',
        'method_fallback' => 'Payment',
        'order_segment' => ' for order #:order',
        'user_segment' => ' by :user',
    ],
    'salary' => [
        'title' => 'Payroll activity updated',
        'description' => 'Payroll run #:id for :count employees is currently :status.',
    ],
    'employees' => [
        'title' => 'New employee added',
        'description' => ':name joined the team.',
    ],
    'users' => [
        'title' => 'New user account created',
        'description' => ':name was added to the platform.',
    ],
    'inventory' => [
        'added_title' => 'Inventory item added',
        'updated_title' => 'Inventory item updated',
        'added_description' => ':name was added to inventory.',
        'updated_description' => ':name inventory details were updated.',
        'qty_meta' => 'Qty :quantity',
    ],
    'products' => [
        'added_title' => 'Product added',
        'updated_title' => 'Product updated',
        'added_description' => ':name is now available in the catalog.',
        'updated_description' => ':name product details were updated.',
    ],
];
