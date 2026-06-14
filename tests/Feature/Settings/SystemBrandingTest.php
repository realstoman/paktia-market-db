<?php

use App\Services\Settings\SystemBrandingService;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('super admin can view system branding settings', function () {
    $role = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);

    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->get(route('system-branding.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/system-branding')
            ->where('branding.name', 'Paktia Market ERP')
        );
});

test('super admin can update system branding settings', function () {
    $role = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);

    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->from(route('system-branding.edit'))
        ->put(route('system-branding.update'), [
            'restaurant_name' => 'Paktia Market Plus',
            'restaurant_short_name' => 'Paktia',
            'primary_color' => '#123456',
            'secondary_color' => '#654321',
            'tertiary_color' => '#FAFAFA',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('system-branding.edit'));

    $branding = app(SystemBrandingService::class)->getBranding();

    expect($branding['name'])->toBe('Paktia Market Plus')
        ->and($branding['shortName'])->toBe('Paktia')
        ->and($branding['primaryColor'])->toBe('#123456')
        ->and($branding['secondaryColor'])->toBe('#654321')
        ->and($branding['tertiaryColor'])->toBe('#FAFAFA');
});

test('non super admins can not access system branding settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('system-branding.edit'))
        ->assertForbidden();
});
