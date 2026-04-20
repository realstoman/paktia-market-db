<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    public function view(User $user, AuditLog $model): bool
    {
        return $user->hasRole('super-admin');
    }

    public function downloadArchive(User $user): bool
    {
        return $user->hasRole('super-admin');
    }
}
