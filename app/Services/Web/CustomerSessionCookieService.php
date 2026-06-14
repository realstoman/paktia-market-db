<?php

namespace App\Services\Web;

use App\Models\Client;
use Illuminate\Contracts\Cookie\QueueingFactory;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Symfony\Component\HttpFoundation\Cookie;

class CustomerSessionCookieService
{
    public function __construct(private readonly QueueingFactory $cookies) {}

    public function makeCookie(Client $client): Cookie
    {
        $minutes = max(60, (int) config('customer_session.ttl_minutes', 60 * 24 * 30));
        $payload = rawurlencode(Crypt::encryptString(json_encode([
            'client_id' => $client->id,
            'firebase_uid' => $client->firebase_uid,
            'issued_at' => now()->toIso8601String(),
        ], JSON_THROW_ON_ERROR)));

        return cookie(
            name: (string) config('customer_session.cookie_name', 'paktia_market_customer_session'),
            value: $payload,
            minutes: $minutes,
            path: '/',
            domain: config('customer_session.domain'),
            secure: (bool) config('customer_session.secure', true),
            httpOnly: true,
            raw: false,
            sameSite: (string) config('customer_session.same_site', 'lax'),
        );
    }

    public function expireCookie(): Cookie
    {
        return cookie()->forget(
            (string) config('customer_session.cookie_name', 'paktia_market_customer_session'),
            '/',
            config('customer_session.domain'),
        );
    }

    public function resolveClientFromRequest(Request $request): ?Client
    {
        $rawCookie = $request->cookie((string) config('customer_session.cookie_name', 'paktia_market_customer_session'));

        if (! is_string($rawCookie) || $rawCookie === '') {
            return null;
        }

        try {
            $payload = json_decode(
                Crypt::decryptString(rawurldecode($rawCookie)),
                true,
                flags: JSON_THROW_ON_ERROR,
            );
        } catch (DecryptException|\JsonException) {
            return null;
        }

        $clientId = isset($payload['client_id']) ? (int) $payload['client_id'] : null;
        $firebaseUid = isset($payload['firebase_uid']) ? (string) $payload['firebase_uid'] : null;

        if (! $clientId || ! $firebaseUid) {
            return null;
        }

        return Client::query()
            ->whereKey($clientId)
            ->where('firebase_uid', $firebaseUid)
            ->where('is_active', true)
            ->first();
    }
}
