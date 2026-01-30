<?php

use App\Models\User;

class UserService
{
    public function create(array $data): User
    {
        $user = User::create($data);
        $user->syncRoles($data['roles'] ?? []);
        return $user;
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        $user->syncRoles($data['roles'] ?? []);
        return $user;
    }

    public function toggleBlock(User $user)
    {
        // Implement block/unblock logic
        $user->blocked = !$user->blocked;
        $user->save();
        return $user;
    }
}
