<?php

namespace App\Enums;

final class Permissions
{
    // Orders
    public const ORDERS_VIEW = 'orders.view';
    public const ORDERS_CREATE = 'orders.create';
    public const ORDERS_UPDATE = 'orders.update';
    public const ORDERS_CANCEL = 'orders.cancel';

    // Products
    public const PRODUCTS_VIEW = 'products.view';
    public const PRODUCTS_CREATE = 'products.create';
    public const PRODUCTS_UPDATE = 'products.update';
    public const PRODUCTS_DELETE = 'products.delete';

    // Inventory
    public const INVENTORY_VIEW = 'inventory.view';
    public const INVENTORY_ADJUST = 'inventory.adjust';

    // Employees
    public const EMPLOYEES_VIEW = 'employees.view';
    public const EMPLOYEES_CREATE = 'employees.create';

    // Finance
    public const PAYMENTS_VIEW = 'payments.view';
    public const EXPENSES_MANAGE = 'expenses.manage';
}
