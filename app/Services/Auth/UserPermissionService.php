<?php

namespace App\Services\Auth;

use App\Models\User;

class UserPermissionService
{
    public function give(User $user, string $permission)
    {
        $user->givePermissionTo($permission);
    }

    public function revoke(User $user, string $permission)
    {
        $user->revokePermissionTo($permission);
    }

    public function sync(User $user, array $permissions)
    {
        $user->syncPermissions($permissions);
    }
}
