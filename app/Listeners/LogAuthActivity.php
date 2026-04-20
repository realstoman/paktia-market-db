<?php

namespace App\Listeners;

use App\Services\Audit\AuditLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;

class LogAuthActivity
{
    public function __construct(private readonly AuditLogger $logger) {}

    public function handleLogin(Login $event): void
    {
        $this->logger->log(
            action: 'auth.login',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleLogout(Logout $event): void
    {
        if ($event->user === null) {
            return;
        }

        $this->logger->log(
            action: 'auth.logout',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleFailed(Failed $event): void
    {
        $credentials = $event->credentials;

        $this->logger->log(
            action: 'auth.login_failed',
            subject: $event->user,
            meta: [
                'email' => $credentials['email'] ?? null,
                'guard' => $event->guard,
            ],
        );
    }

    public function handleLockout(Lockout $event): void
    {
        $this->logger->log(
            action: 'auth.lockout',
            meta: [
                'email' => $event->request->input('email'),
                'ip' => $event->request->ip(),
            ],
        );
    }

    public function handlePasswordReset(PasswordReset $event): void
    {
        $this->logger->log(
            action: 'auth.password_reset',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleRegistered(Registered $event): void
    {
        $this->logger->log(
            action: 'auth.registered',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleVerified(Verified $event): void
    {
        $this->logger->log(
            action: 'auth.email_verified',
            subject: $event->user,
            causer: $event->user,
        );
    }

    /**
     * @return array<class-string, string>
     */
    public function subscribe(): array
    {
        return [
            Login::class => 'handleLogin',
            Logout::class => 'handleLogout',
            Failed::class => 'handleFailed',
            Lockout::class => 'handleLockout',
            PasswordReset::class => 'handlePasswordReset',
            Registered::class => 'handleRegistered',
            Verified::class => 'handleVerified',
        ];
    }
}
