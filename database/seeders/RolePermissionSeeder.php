<?php

namespace Database\Seeders;

use App\Enums\PermissionEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

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
            'finance' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::FINANCE_VIEW,
                PermissionEnum::FINANCE_MANAGE,
                PermissionEnum::SHAREHOLDERS_VIEW,
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
                PermissionEnum::REPORTS_VIEW,
            ],
            'view-only' => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::INVENTORY_VIEW,
                PermissionEnum::EMPLOYEES_VIEW,
                PermissionEnum::FINANCE_VIEW,
                PermissionEnum::SHAREHOLDERS_VIEW,
                PermissionEnum::REPORTS_VIEW,
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
