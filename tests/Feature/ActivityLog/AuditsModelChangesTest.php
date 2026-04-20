<?php

use App\Jobs\WriteAuditLogJob;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Province;
use App\Models\User;

function createTestBranch(string $name = 'Central'): Branch
{
    $country = Country::query()->create([
        'name' => 'Testland',
        'code' => 'TL',
        'currency_code' => 'TLC',
        'currency_symbol' => 'T',
        'is_active' => true,
    ]);

    $province = Province::query()->create([
        'name' => 'Northern',
        'country_id' => $country->id,
    ]);

    return Branch::query()->create([
        'name' => $name,
        'country_id' => $country->id,
        'province_id' => $province->id,
        'address' => '1 Main St',
        'description' => 'Main branch',
        'is_active' => true,
    ]);
}

test('creating an audited model writes a created audit log', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $this->actingAs($user);

    $branch = createTestBranch();

    $log = AuditLog::query()
        ->where('auditable_type', Branch::class)
        ->where('auditable_id', $branch->id)
        ->where('action', 'created')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($user->id)
        ->and($log->new_values['name'] ?? null)->toBe('Central');
});

test('updating an audited model records old/new values excluding hidden fields', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $this->actingAs($user);

    $branch = createTestBranch('Original');

    $branch->update(['name' => 'Renamed']);

    $log = AuditLog::query()
        ->where('auditable_type', Branch::class)
        ->where('auditable_id', $branch->id)
        ->where('action', 'updated')
        ->latest('id')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values['name'] ?? null)->toBe('Original')
        ->and($log->new_values['name'] ?? null)->toBe('Renamed');
});

test('the WriteAuditLogJob persists to the audit_logs table', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    (new WriteAuditLogJob([
        'user_id' => $user->id,
        'action' => 'created',
        'auditable_type' => User::class,
        'auditable_id' => $user->id,
        'new_values' => ['name' => $user->name],
        'batch_uuid' => '11111111-1111-1111-1111-111111111111',
    ]))->handle();

    $log = AuditLog::query()
        ->where('batch_uuid', '11111111-1111-1111-1111-111111111111')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->action)->toBe('created')
        ->and($log->auditable_type)->toBe(User::class);
});

test('user password and two factor fields are masked in audit logs', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $log = AuditLog::query()
        ->where('auditable_type', User::class)
        ->where('auditable_id', $user->id)
        ->where('action', 'created')
        ->first();

    expect($log)->not->toBeNull();

    $newValues = $log->new_values ?? [];

    // Password should either be absent (ignored) or masked — never cleartext hash.
    if (array_key_exists('password', $newValues)) {
        expect($newValues['password'])->toBe('***');
    }

    if (array_key_exists('two_factor_secret', $newValues)) {
        expect($newValues['two_factor_secret'])->toBe('***');
    }
});
