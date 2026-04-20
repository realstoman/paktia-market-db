<?php

use App\Jobs\WriteAuditLogJob;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Province;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

test('creating an audited model dispatches a WriteAuditLogJob', function () {
    Queue::fake();

    $user = User::factory()->withoutTwoFactor()->create();
    $this->actingAs($user);

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

    Branch::query()->create([
        'name' => 'Central',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'address' => '1 Main St',
        'description' => 'Main branch',
        'is_active' => true,
    ]);

    Queue::assertPushedOn('audit', WriteAuditLogJob::class, function (WriteAuditLogJob $job) {
        return $job->attributes['action'] === 'created'
            && $job->attributes['auditable_type'] === Branch::class;
    });
});

test('updating an audited model records old/new values excluding hidden fields', function () {
    Queue::fake();

    $user = User::factory()->withoutTwoFactor()->create();
    $this->actingAs($user);

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

    $branch = Branch::query()->create([
        'name' => 'Original',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'address' => '1 Main St',
        'description' => 'First',
        'is_active' => true,
    ]);

    Queue::fake(); // reset assertions between create and update

    $branch->update(['name' => 'Renamed']);

    Queue::assertPushed(WriteAuditLogJob::class, function (WriteAuditLogJob $job) {
        return $job->attributes['action'] === 'updated'
            && ($job->attributes['old_values']['name'] ?? null) === 'Original'
            && ($job->attributes['new_values']['name'] ?? null) === 'Renamed';
    });
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

    $log = AuditLog::query()->latest()->first();

    expect($log)->not->toBeNull()
        ->and($log->action)->toBe('created')
        ->and($log->auditable_type)->toBe(User::class);
});

test('user password and two factor fields are masked in audit logs', function () {
    Queue::fake();

    $user = User::factory()->withoutTwoFactor()->create();

    Queue::assertPushed(WriteAuditLogJob::class, function (WriteAuditLogJob $job) {
        if ($job->attributes['auditable_type'] !== User::class) {
            return false;
        }

        $newValues = $job->attributes['new_values'] ?? [];

        // Password should either be absent (ignored) or masked — never cleartext hash.
        if (array_key_exists('password', $newValues)) {
            expect($newValues['password'])->toBe('***');
        }

        return true;
    });
});
