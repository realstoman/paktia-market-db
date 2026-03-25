<?php

namespace Database\Seeders;

use App\Enums\PermissionEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionEnum::cases() as $p) {
            Permission::firstOrCreate([
                'name' => $p->value,
                'guard_name' => 'web',
            ]);
        }

        $roles = [
            'super-admin' => PermissionEnum::cases(),
            'cashier' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::ORDERS_VIEW,
                PermissionEnum::ORDERS_CREATE,
                PermissionEnum::ORDERS_UPDATE,
                PermissionEnum::PRODUCTS_VIEW,
                PermissionEnum::PAYMENTS_VIEW,
                PermissionEnum::PAYMENTS_CREATE,
                PermissionEnum::REPORTS_VIEW,
            ],
            'order-taker' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::ORDERS_VIEW,
                PermissionEnum::ORDERS_CREATE,
                PermissionEnum::ORDERS_UPDATE,
                PermissionEnum::PRODUCTS_VIEW,
            ],
            'server' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::ORDERS_VIEW,
                PermissionEnum::ORDERS_UPDATE,
                PermissionEnum::PRODUCTS_VIEW,
            ],
            'finance' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::FINANCE_VIEW,
                PermissionEnum::FINANCE_MANAGE,
                PermissionEnum::PAYMENTS_VIEW,
                PermissionEnum::PAYMENTS_CREATE,
                PermissionEnum::EXPENSES_VIEW,
                PermissionEnum::EXPENSES_CREATE,
                PermissionEnum::PAYROLL_VIEW,
                PermissionEnum::PAYROLL_CREATE,
                PermissionEnum::PAYROLL_APPROVE,
                PermissionEnum::PAYROLL_PAY,
                PermissionEnum::REPORTS_VIEW,
                PermissionEnum::REPORTS_EXPORT,
            ],
            'hr' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::EMPLOYEES_VIEW,
                PermissionEnum::EMPLOYEES_CREATE,
                PermissionEnum::EMPLOYEES_UPDATE,
                PermissionEnum::PAYROLL_VIEW,
            ],
            'inventory' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::INVENTORY_VIEW,
                PermissionEnum::INVENTORY_ADJUST,
                PermissionEnum::PRODUCTS_VIEW,
                PermissionEnum::REPORTS_VIEW,
            ],
            'view-only' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::ORDERS_VIEW,
                PermissionEnum::PRODUCTS_VIEW,
                PermissionEnum::INVENTORY_VIEW,
                PermissionEnum::EMPLOYEES_VIEW,
                PermissionEnum::FINANCE_VIEW,
                PermissionEnum::REPORTS_VIEW,
            ],
            'kitchen' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::KITCHEN_VIEW,
                PermissionEnum::ORDERS_VIEW,
                PermissionEnum::ORDERS_UPDATE,
            ],
        ];

        foreach ($roles as $name => $permissions) {
            $resolvedPermissions = collect($permissions)
                ->map(fn (PermissionEnum $permission) => $permission->value)
                ->all();

            Role::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ])
                ->syncPermissions($resolvedPermissions);
        }
    }
}
