<?php

namespace App\Services\Auth;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionService
{
    public function getRoleIndexData(): array
    {
        return [
            'roles' => Role::with('permissions')->get(),
            'permissions' => Permission::orderBy('name')->get(),
        ];
    }

    public function create(string $name): Permission
    {
        return Permission::create([
            'name' => $name,
            'guard_name' => config('auth.defaults.guard', 'web'),
        ]);
    }
}
