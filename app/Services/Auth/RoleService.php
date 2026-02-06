<?php

namespace App\Services\Auth;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleService
{
    public function create(string $name, array $permissionIds = [])
    {
        $role = Role::create(['name' => $name]);
        $permissions = Permission::whereIn('id', $permissionIds)->get();
        $role->syncPermissions($permissions);
        return $role;
    }

    public function update(Role $role, array $permissionIds = [])
    {
        $permissions = Permission::whereIn('id', $permissionIds)->get();
        $role->syncPermissions($permissions);
        return $role;
    }
}
