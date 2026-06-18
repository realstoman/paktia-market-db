<?php

use App\Models\AuditLog;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(\Database\Seeders\RolePermissionSeeder::class);
});

test('non super-admin users receive 403 when accessing the activity logs page', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    Role::findOrCreate('cashier', 'web');
    $user->assignRole('cashier');

    $this->actingAs($user)
        ->get('/admin/activity-logs')
        ->assertForbidden();
});

test('super-admin can access the activity logs page', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $user->assignRole('super-admin');

    $response = $this->actingAs($user)->get('/admin/activity-logs');

    $response->assertOk();
});

test('super-admin can view a specific audit log entry', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $user->assignRole('super-admin');

    $log = AuditLog::query()->create([
        'user_id' => $user->id,
        'action' => 'created',
        'auditable_type' => 'App\\Models\\Property',
        'auditable_id' => 1,
        'new_values' => ['name' => 'A'],
    ]);

    $this->actingAs($user)
        ->get("/admin/activity-logs/{$log->id}")
        ->assertOk();
});
