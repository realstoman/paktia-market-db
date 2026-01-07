<?php

namespace Database\Seeders;

use App\Enums\Permissions;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use ReflectionClass;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        foreach ((new ReflectionClass(Permissions::class))->getConstants() as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions(Permission::all());

        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions([
            Permissions::ORDERS_VIEW,
            Permissions::ORDERS_CREATE,
            Permissions::PRODUCTS_VIEW,
        ]);
    }
}

