<?php

namespace App\Services\Mobile;

use App\Models\Client;

class ClientSyncService
{
    public function sync(array $firebaseUser, array $payload = []): Client
    {
        return Client::updateOrCreate(
            [
                'firebase_uid' => $firebaseUser['uid'],
            ],
            [
                'email' => $payload['email'] ?? $firebaseUser['email'] ?? null,
                'phone' => $payload['phone'] ?? null,
                'name' => $payload['name'] ?? $firebaseUser['name'] ?? null,
                'avatar_url' => $payload['avatar_url'] ?? null,
                'provider' => $payload['provider'] ?? null,
                'email_verified_at' => ($firebaseUser['email_verified'] ?? false) ? now() : null,
                'last_login_at' => now(),
                'is_active' => true,
            ],
        );
    }
}
