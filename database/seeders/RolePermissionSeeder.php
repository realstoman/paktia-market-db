<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Enums\PermissionEnum;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionEnum::cases() as $p) {
            Permission::firstOrCreate(['name' => $p->value]);
        }

        $roles = [
            'super-admin' => Permission::all(),
            'manager' => ['user.view', 'product.view'],
        ];

        foreach ($roles as $name => $permissions) {
            Role::firstOrCreate(['name' => $name])
                ->syncPermissions($permissions);
        }
    }
}

