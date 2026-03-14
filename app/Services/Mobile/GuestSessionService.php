<?php

namespace App\Services\Mobile;

use App\Models\GuestSession;
use Illuminate\Support\Str;

class GuestSessionService
{
    public function create(array $payload): GuestSession
    {
        return GuestSession::create([
            'token' => 'guest_'.Str::random(64),
            'device_id' => $payload['device_id'] ?? null,
            'platform' => $payload['platform'] ?? null,
            'app_version' => $payload['app_version'] ?? null,
            'expires_at' => now()->addDays(config('mobile.guest.expires_in_days', 30)),
            'is_active' => true,
        ]);
    }

    public function findActiveByToken(?string $token): ?GuestSession
    {
        if (! $token) {
            return null;
        }

        return GuestSession::query()
            ->active()
            ->where('token', $token)
            ->first();
    }
}
