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
            'permissions' => Permission::all(),
        ];
    }
}
