<?php

namespace App\Listeners;

use App\Services\Audit\AuditLogger;
use Laravel\Fortify\Events\RecoveryCodesGenerated;
use Laravel\Fortify\Events\TwoFactorAuthenticationConfirmed;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;
use Laravel\Fortify\Events\TwoFactorAuthenticationEnabled;
use Laravel\Fortify\Events\TwoFactorAuthenticationFailed;

class LogTwoFactorActivity
{
    public function __construct(private readonly AuditLogger $logger) {}

    public function handleEnabled(TwoFactorAuthenticationEnabled $event): void
    {
        $this->logger->log(
            action: 'auth.2fa.enabled',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleConfirmed(TwoFactorAuthenticationConfirmed $event): void
    {
        $this->logger->log(
            action: 'auth.2fa.confirmed',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleDisabled(TwoFactorAuthenticationDisabled $event): void
    {
        $this->logger->log(
            action: 'auth.2fa.disabled',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleRecoveryCodesGenerated(RecoveryCodesGenerated $event): void
    {
        $this->logger->log(
            action: 'auth.2fa.recovery_codes_generated',
            subject: $event->user,
            causer: $event->user,
        );
    }

    public function handleFailed(TwoFactorAuthenticationFailed $event): void
    {
        $this->logger->log(
            action: 'auth.2fa.failed',
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
            TwoFactorAuthenticationEnabled::class => 'handleEnabled',
            TwoFactorAuthenticationConfirmed::class => 'handleConfirmed',
            TwoFactorAuthenticationDisabled::class => 'handleDisabled',
            RecoveryCodesGenerated::class => 'handleRecoveryCodesGenerated',
            TwoFactorAuthenticationFailed::class => 'handleFailed',
        ];
    }
}
