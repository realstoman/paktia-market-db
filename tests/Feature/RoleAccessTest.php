<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

test('super admin can access user and property management pages', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('super-admin');

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('properties.index'))
        ->assertOk();
});

test('non super admin cannot access user and property management pages', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('inventory');

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('properties.index'))
        ->assertForbidden();
});
