<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Users
    case USER_VIEW = 'user.view';
    case USER_CREATE = 'user.create';
    case USER_UPDATE = 'user.update';
    case USER_BLOCK = 'user.block';

    // Roles & Permissions
    case ROLE_VIEW = 'role.view';
    case ROLE_CREATE = 'role.create';
    case ROLE_ASSIGN = 'role.assign';

    // Branches
    case BRANCH_VIEW = 'branch.view';
    case BRANCH_CREATE = 'branch.create';
    case BRANCH_UPDATE = 'branch.update';
    case BRANCH_DELETE = 'branch.delete';

    // Branches
    case KITCHEN_VIEW = 'kitchen.view';
    case KITCHEN_CREATE = 'kitchen.create';
    case KITCHEN_UPDATE = 'kitchen.update';
    case KITCHEN_DELETE = 'kitchen.delete';

    // Orders
    case ORDERS_VIEW = 'orders.view';
    case ORDERS_CREATE = 'orders.create';
    case ORDERS_UPDATE = 'orders.update';
    case ORDERS_CANCEL = 'orders.cancel';

    // Products
    case PRODUCTS_VIEW = 'products.view';
    case PRODUCTS_CREATE = 'products.create';
    case PRODUCTS_UPDATE = 'products.update';
    case PRODUCTS_DELETE = 'products.delete';

    // Banners
    case BANNERS_VIEW = 'banners.view';
    case BANNERS_CREATE = 'banners.create';
    case BANNERS_UPDATE = 'banners.update';
    case BANNERS_DELETE = 'banners.delete';

    // Inventory
    case INVENTORY_VIEW = 'inventory.view';
    case INVENTORY_ADJUST = 'inventory.adjust';

    // Employees
    case EMPLOYEES_VIEW = 'employees.view';
    case EMPLOYEES_CREATE = 'employees.create';
    case EMPLOYEES_UPDATE = 'employees.update';

    // Finance
    case PAYMENTS_VIEW = 'payments.view';
    case PAYMENTS_CREATE = 'payments.create';
    case EXPENSES_VIEW = 'expenses.view';
    case EXPENSES_CREATE = 'expenses.create';

    // Admin
    case ROLES_MANAGE = 'roles.manage';
    case PERMISSIONS_MANAGE = 'permissions.manage';
}
