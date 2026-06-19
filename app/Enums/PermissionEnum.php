<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Dashboard
    case DASHBOARD_VIEW = 'dashboard.view';

    // Users
    case USER_VIEW = 'user.view';
    case USER_CREATE = 'user.create';
    case USER_UPDATE = 'user.update';
    case USER_BLOCK = 'user.block';
    case USER_RESET_PASSWORD = 'user.reset-password';

    // Roles & Permissions
    case ROLE_VIEW = 'role.view';
    case ROLE_CREATE = 'role.create';
    case ROLE_ASSIGN = 'role.assign';

    // Properties
    case PROPERTY_VIEW = 'property.view';
    case PROPERTY_CREATE = 'property.create';
    case PROPERTY_UPDATE = 'property.update';
    case PROPERTY_DELETE = 'property.delete';

    // Shareholders
    case SHAREHOLDERS_VIEW = 'shareholders.view';
    case SHAREHOLDERS_MANAGE = 'shareholders.manage';

    // Tenants & Businesses
    case TENANTS_VIEW = 'tenants.view';
    case TENANTS_MANAGE = 'tenants.manage';

    // Banners
    case BANNERS_VIEW = 'banners.view';
    case BANNERS_CREATE = 'banners.create';
    case BANNERS_UPDATE = 'banners.update';
    case BANNERS_DELETE = 'banners.delete';

    // Inventory
    case INVENTORY_VIEW = 'inventory.view';
    case INVENTORY_ADJUST = 'inventory.adjust';
    case INVENTORY_DELETE = 'inventory.delete';

    // Employees
    case EMPLOYEES_VIEW = 'employees.view';
    case EMPLOYEES_CREATE = 'employees.create';
    case EMPLOYEES_UPDATE = 'employees.update';

    // Finance
    case FINANCE_VIEW = 'finance.view';
    case FINANCE_MANAGE = 'finance.manage';
    case EXPENSES_VIEW = 'expenses.view';
    case EXPENSES_CREATE = 'expenses.create';
    case PAYROLL_VIEW = 'payroll.view';
    case PAYROLL_CREATE = 'payroll.create';
    case PAYROLL_APPROVE = 'payroll.approve';
    case PAYROLL_PAY = 'payroll.pay';

    // Reports
    case REPORTS_VIEW = 'reports.view';
    case REPORTS_EXPORT = 'reports.export';

    // Admin
    case ROLES_MANAGE = 'roles.manage';
    case PERMISSIONS_MANAGE = 'permissions.manage';
}
