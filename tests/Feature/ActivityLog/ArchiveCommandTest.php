<?php

use App\Models\AuditLog;
use App\Models\AuditLogArchive;
use Illuminate\Support\Facades\Storage;

function createAuditLog(array $attributes, \Carbon\CarbonInterface $createdAt): AuditLog
{
    $log = AuditLog::query()->create($attributes);
    $log->forceFill([
        'created_at' => $createdAt,
        'updated_at' => $createdAt,
    ])->save();

    return $log;
}

test('pos:archive-audit-logs archives old rows and prunes them', function () {
    Storage::fake('local');

    createAuditLog([
        'action' => 'created',
        'auditable_type' => 'App\\Models\\Property',
        'auditable_id' => 1,
        'new_values' => ['name' => 'A'],
    ], now()->subMonths(3)->startOfMonth()->addDays(5));

    createAuditLog([
        'action' => 'updated',
        'auditable_type' => 'App\\Models\\Property',
        'auditable_id' => 1,
        'old_values' => ['name' => 'A'],
        'new_values' => ['name' => 'B'],
    ], now()->subMonths(3)->startOfMonth()->addDays(10));

    // Recent row that should NOT be archived.
    AuditLog::query()->create([
        'action' => 'created',
        'auditable_type' => 'App\\Models\\Expense',
        'auditable_id' => 5,
        'new_values' => ['id' => 5],
    ]);

    expect(AuditLog::query()->count())->toBe(3);

    $this->artisan('pos:archive-audit-logs', ['--days' => 30, '--disk' => 'local'])
        ->assertExitCode(0);

    $archive = AuditLogArchive::query()->first();

    expect($archive)->not->toBeNull()
        ->and($archive->records_count)->toBe(2);

    Storage::disk('local')->assertExists($archive->path);

    // The two old rows should be gone; the recent one remains.
    expect(AuditLog::query()->count())->toBe(1)
        ->and(AuditLog::query()->first()->auditable_type)->toBe('App\\Models\\Expense');
});

test('pos:archive-audit-logs is a no-op when no rows qualify', function () {
    Storage::fake('local');

    AuditLog::query()->create([
        'action' => 'created',
        'auditable_type' => 'App\\Models\\Expense',
        'auditable_id' => 1,
        'new_values' => ['id' => 1],
    ]);

    $this->artisan('pos:archive-audit-logs', ['--days' => 30, '--disk' => 'local'])
        ->expectsOutputToContain('No audit logs to archive.')
        ->assertExitCode(0);

    expect(AuditLogArchive::query()->count())->toBe(0)
        ->and(AuditLog::query()->count())->toBe(1);
});

test('dry-run does not delete records', function () {
    Storage::fake('local');

    createAuditLog([
        'action' => 'created',
        'auditable_type' => 'App\\Models\\Property',
        'auditable_id' => 1,
        'new_values' => ['name' => 'A'],
    ], now()->subMonths(4)->startOfMonth());

    $this->artisan('pos:archive-audit-logs', ['--days' => 30, '--disk' => 'local', '--dry-run' => true])
        ->assertExitCode(0);

    expect(AuditLog::query()->count())->toBe(1);
});
