<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

test('super admin can reset another users password from user management', function () {
    $superAdminRole = Role::create([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole($superAdminRole);

    $targetUser = User::factory()->create([
        'password' => 'old-password',
    ]);

    $response = $this
        ->actingAs($superAdmin)
        ->from(route('users.index'))
        ->put(route('users.reset-password', $targetUser), [
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users.index'));

    expect(Hash::check('new-password-123', $targetUser->fresh()->password))
        ->toBeTrue();
});

test('internal users cannot delete their own account from profile settings', function () {
    $user = User::factory()->create([
        'property_id' => 1,
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasErrors('account')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
    $this->assertAuthenticatedAs($user->fresh());
});

test('users can not block their own account from user management', function () {
    $superAdminRole = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);

    $superAdmin = User::factory()->create([
        'is_active' => true,
    ]);
    $superAdmin->assignRole($superAdminRole);

    $response = $this
        ->actingAs($superAdmin)
        ->from(route('users.index'))
        ->post(route('users.block', $superAdmin));

    $response
        ->assertSessionHasErrors('user')
        ->assertRedirect(route('users.index'));

    expect($superAdmin->fresh()?->is_active)->toBeTrue();
});

test('users can not delete their own account from user management', function () {
    $superAdminRole = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole($superAdminRole);

    $response = $this
        ->actingAs($superAdmin)
        ->from(route('users.index'))
        ->delete(route('users.destroy', $superAdmin));

    $response
        ->assertSessionHasErrors('user')
        ->assertRedirect(route('users.index'));

    expect($superAdmin->fresh())->not->toBeNull();
});
