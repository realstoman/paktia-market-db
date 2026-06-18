<?php

return [
    'catalog' => [
        'inventory' => [
            'title' => 'Inventory',
            'description' => 'Warehouse stock levels, values, and availability.',
        ],
        'employees' => [
            'title' => 'Employees',
            'description' => 'Employee and market allocation overview.',
        ],
        'finance' => [
            'title' => 'Finance',
            'description' => 'Expenses and cash movement activity.',
        ],
        'branches' => [
            'title' => 'Markets & Properties',
            'description' => 'Market staffing and warehouse coverage.',
        ],
        'users' => [
            'title' => 'Users',
            'description' => 'Internal account and access overview.',
        ],
    ],
    'overview' => [
        'stock_items' => 'Stock items',
        'stock_value' => 'Stock value',
        'employees' => 'Employees',
        'active_employees' => 'Active employees',
        'approved_expenses' => 'Approved expenses',
        'pending_approvals' => 'Pending approvals',
        'branches' => 'Markets',
        'active_branches' => 'Active markets',
        'accounts' => 'Accounts',
        'active_accounts' => 'Active accounts',
    ],
    'reports' => [
        'inventory' => [
            'title' => 'Inventory Report',
            'description' => 'Warehouse stock levels and current valuation.',
        ],
        'employees' => [
            'title' => 'Employees Report',
            'description' => 'Employee status and market allocation.',
        ],
        'finance' => [
            'title' => 'Finance Report',
            'description' => 'Expense activity for the selected period.',
        ],
        'branches' => [
            'title' => 'Markets & Properties Report',
            'description' => 'Market staffing and warehouse coverage.',
        ],
        'users' => [
            'title' => 'Users Report',
            'description' => 'Internal accounts and assigned access.',
        ],
    ],
    'columns' => [
        'item' => 'Item',
        'branch' => 'Market',
        'quantity' => 'Quantity',
        'unit' => 'Unit',
        'value' => 'Value',
        'status' => 'Status',
        'employee' => 'Employee',
        'position' => 'Position',
        'date' => 'Date',
        'reference' => 'Reference',
        'description' => 'Description',
        'amount' => 'Amount',
        'employees' => 'Employees',
        'inventory' => 'Inventory Items',
        'user' => 'User',
        'email' => 'Email',
        'roles' => 'Roles',
    ],
    'status' => [
        'unassigned' => 'Unassigned',
        'out_of_stock' => 'Out of stock',
        'low_stock' => 'Low stock',
        'available' => 'Available',
        'active' => 'Active',
        'inactive' => 'Inactive',
        'draft' => 'Draft',
        'submitted' => 'Submitted',
        'approved' => 'Approved',
        'rejected' => 'Rejected',
    ],
    'summary' => [
        'stock_items' => 'Stock Items',
        'inventory_value' => 'Inventory Value',
        'employees' => 'Employees',
        'active' => 'Active',
        'expenses' => 'Expenses',
        'approved_amount' => 'Approved Amount',
        'branches' => 'Markets',
        'accounts' => 'Accounts',
    ],
    'export' => [
        'note' => 'Generated from current Paktiawal Group market records.',
        'queued_title' => 'Report export queued',
        'queued_description' => 'We are generating :filename. You can download it from the reports page once it is ready.',
    ],
    'period' => [
        'range' => ':start to :end',
    ],
    'reference' => [
        'expense' => 'Expense #:id',
    ],
];
