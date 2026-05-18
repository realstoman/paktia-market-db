<?php

namespace App\Services\Mobile;

use App\Models\Client;

class ClientSyncService
{
    public function sync(array $firebaseUser, array $payload = []): Client
    {
        /** @var Client $client */
        $client = Client::firstOrNew([
            'firebase_uid' => $firebaseUser['uid'],
        ]);

        $client->email = $payload['email']
            ?? $firebaseUser['email']
            ?? $client->email;

        $client->phone = array_key_exists('phone', $payload)
            ? ($payload['phone'] ?: $client->phone)
            : $client->phone;

        $client->name = $payload['name']
            ?? $client->name
            ?? $firebaseUser['name']
            ?? null;

        $client->avatar_url = $payload['avatar_url']
            ?? $client->avatar_url
            ?? ($firebaseUser['picture'] ?? null);

        $client->provider = $payload['provider']
            ?? ($firebaseUser['provider'] ?? null)
            ?? $client->provider;

        $client->email_verified_at = ($firebaseUser['email_verified'] ?? false)
            ? ($client->email_verified_at ?? now())
            : $client->email_verified_at;

        $client->last_login_at = now();
        $client->is_active = true;
        $client->save();

        return $client;
    }
}
