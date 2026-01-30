<?php

use Spatie\Permission\Models\Role;

class RoleService
{
    public function create(string $name, array $permissions)
    {
        $role = Role::create(['name' => $name]);
        $role->syncPermissions($permissions);
        return $role;
    }

    public function update(Role $role, array $permissions)
    {
        $role->syncPermissions($permissions);
        return $role;
    }
}
