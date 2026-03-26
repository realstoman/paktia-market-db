<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

test('super admin can access user and branch management pages', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('super-admin');

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('branches.index'))
        ->assertOk();
});

test('non super admin cannot access user and branch management pages', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('cashier');

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('branches.index'))
        ->assertForbidden();
});
