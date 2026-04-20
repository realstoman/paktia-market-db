<?php

use App\Listeners\LogAuthActivity;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

test('login event writes an auth.login audit log', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    app(LogAuthActivity::class)->handleLogin(new Login('web', $user, false));

    $log = AuditLog::query()->where('action', 'auth.login')->latest('id')->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($user->id);
});

test('logout event writes an auth.logout audit log', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    app(LogAuthActivity::class)->handleLogout(new Logout('web', $user));

    $log = AuditLog::query()->where('action', 'auth.logout')->latest('id')->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($user->id);
});

test('failed login event writes an auth.login_failed audit log with email meta', function () {
    app(LogAuthActivity::class)->handleFailed(new Failed('web', null, [
        'email' => 'hacker@example.com',
        'password' => 'secret',
    ]));

    $log = AuditLog::query()->where('action', 'auth.login_failed')->latest('id')->first();

    expect($log)->not->toBeNull()
        ->and($log->meta['email'] ?? null)->toBe('hacker@example.com');
});

test('audit logger records a batch uuid for every event', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    app(AuditLogger::class)->log(
        action: 'test.action',
        causer: $user,
        meta: ['note' => 'context-capture'],
    );

    $log = AuditLog::query()->where('action', 'test.action')->latest('id')->first();

    expect($log)->not->toBeNull()
        ->and($log->batch_uuid)->not->toBeNull();
});
