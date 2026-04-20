<?php

use App\Jobs\WriteAuditLogJob;
use App\Listeners\LogAuthActivity;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Queue;

test('login event dispatches an auth.login audit log', function () {
    Queue::fake();

    $user = User::factory()->withoutTwoFactor()->create();

    app(LogAuthActivity::class)->handleLogin(new Login('web', $user, false));

    Queue::assertPushed(WriteAuditLogJob::class, function (WriteAuditLogJob $job) {
        return $job->attributes['action'] === 'auth.login';
    });
});

test('logout event dispatches an auth.logout audit log', function () {
    Queue::fake();

    $user = User::factory()->withoutTwoFactor()->create();

    app(LogAuthActivity::class)->handleLogout(new Logout('web', $user));

    Queue::assertPushed(WriteAuditLogJob::class, function (WriteAuditLogJob $job) {
        return $job->attributes['action'] === 'auth.logout';
    });
});

test('failed login event dispatches an auth.login_failed audit log with email meta', function () {
    Queue::fake();

    app(LogAuthActivity::class)->handleFailed(new Failed('web', null, [
        'email' => 'hacker@example.com',
        'password' => 'secret',
    ]));

    Queue::assertPushed(WriteAuditLogJob::class, function (WriteAuditLogJob $job) {
        return $job->attributes['action'] === 'auth.login_failed'
            && ($job->attributes['meta']['email'] ?? null) === 'hacker@example.com';
    });
});

test('audit logger records request context fields when a request is bound', function () {
    Queue::fake();

    $user = User::factory()->withoutTwoFactor()->create();

    app(AuditLogger::class)->log(
        action: 'test.action',
        causer: $user,
        meta: ['note' => 'context-capture'],
    );

    Queue::assertPushed(WriteAuditLogJob::class, function (WriteAuditLogJob $job) {
        return $job->attributes['action'] === 'test.action'
            && $job->attributes['batch_uuid'] !== null;
    });
});
