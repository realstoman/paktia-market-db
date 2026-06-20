<?php

use App\Models\User;
use App\Services\Operations\RuntimeHealthService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('super-admin can run runtime health checks from the system', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $user->assignRole('super-admin');

    Cache::store(config('pos.cache.store'))->forget(RuntimeHealthService::RECENT_CHECK_CACHE_KEY);

    $this->actingAs($user)
        ->post(route('operations.runtime-health.run'))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Cache::store(config('pos.cache.store'))->get(RuntimeHealthService::RECENT_CHECK_CACHE_KEY))
        ->not->toBeNull()
        ->and(app(RuntimeHealthService::class)->snapshot()['components']['recentRefresh']['status'])
        ->toBe('healthy');
});

test('non super-admin users cannot run runtime health checks', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    Role::findOrCreate('cashier', 'web');
    $user->assignRole('cashier');

    $this->actingAs($user)
        ->post(route('operations.runtime-health.run'))
        ->assertForbidden();
});

test('optional redis and property sync services are healthy when they are not required', function () {
    config()->set('cache.default', 'array');
    config()->set('pos.cache.store', 'array');
    config()->set('queue.default', 'sync');
    config()->set('pos.sync.enabled', false);
    config()->set('pos.sync.remote_base_url', null);

    $components = app(RuntimeHealthService::class)->snapshot()['components'];

    expect($components['redis']['status'])->toBe('healthy')
        ->and($components['redis']['messageKey'])->toBe('redis.notRequired')
        ->and($components['sync']['status'])->toBe('healthy')
        ->and($components['sync']['messageKey'])->toBe('sync.notEnabled');
});
