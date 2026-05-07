<?php

namespace App\Services\Mobile;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class FirebaseAuthService
{
    public function verifyIdToken(?string $token): array
    {
        if (! $token) {
            throw new AuthenticationException('Missing Firebase ID token.');
        }

        if (config('mobile.firebase.stub_mode')) {
            return $this->verifyStubToken($token);
        }

        $projectId = (string) config('mobile.firebase.project_id', '');

        if ($projectId === '') {
            throw new AuthenticationException('Firebase project is not configured.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $this->splitJwt($token);
        $header = $this->decodeJwtSegment($encodedHeader);
        $payload = $this->decodeJwtSegment($encodedPayload);

        $algorithm = $header['alg'] ?? null;
        $keyId = $header['kid'] ?? null;

        if ($algorithm !== 'RS256' || ! is_string($keyId) || $keyId === '') {
            throw new AuthenticationException('Invalid Firebase token header.');
        }

        $keySet = $this->getFirebaseKeySet();
        $jwk = collect($keySet['keys'] ?? [])->firstWhere('kid', $keyId);

        if (! is_array($jwk)) {
            throw new AuthenticationException('Unable to find Firebase signing key.');
        }

        $publicKey = $this->buildPemFromJwk($jwk);
        $signature = $this->decodeBase64Url($encodedSignature);
        $signedContent = $encodedHeader.'.'.$encodedPayload;

        $verified = openssl_verify($signedContent, $signature, $publicKey, OPENSSL_ALGO_SHA256);

        if ($verified !== 1) {
            throw new AuthenticationException('Invalid Firebase token signature.');
        }

        $this->validatePayload($payload, $projectId);

        return [
            'uid' => (string) $payload['sub'],
            'email' => $payload['email'] ?? null,
            'name' => $payload['name'] ?? null,
            'picture' => $payload['picture'] ?? null,
            'provider' => $payload['firebase']['sign_in_provider'] ?? null,
            'email_verified' => (bool) ($payload['email_verified'] ?? false),
            'claims' => $payload,
        ];
    }

    private function verifyStubToken(string $token): array
    {
        if (! str_starts_with($token, 'stub:')) {
            throw new AuthenticationException('Invalid Firebase ID token.');
        }

        $uid = trim(substr($token, 5));

        if ($uid === '') {
            throw new AuthenticationException('Invalid Firebase stub token.');
        }

        return [
            'uid' => $uid,
            'email' => null,
            'name' => null,
            'picture' => null,
            'provider' => null,
            'email_verified' => false,
            'claims' => [],
        ];
    }

    private function getFirebaseKeySet(): array
    {
        $cacheSeconds = max(60, (int) config('mobile.firebase.keys_cache_seconds', 3600));
        $cacheKey = 'firebase_keys_v1';
        $keysUrl = (string) config('mobile.firebase.keys_url');

        return Cache::remember($cacheKey, $cacheSeconds, function () use ($keysUrl): array {
            $response = Http::timeout(10)->acceptJson()->get($keysUrl);

            if (! $response->successful()) {
                throw new AuthenticationException('Unable to fetch Firebase signing keys.');
            }

            $json = $response->json();

            if (! is_array($json) || ! isset($json['keys']) || ! is_array($json['keys'])) {
                throw new AuthenticationException('Invalid Firebase key response.');
            }

            return $json;
        });
    }

    private function validatePayload(array $payload, string $projectId): void
    {
        $issuer = 'https://securetoken.google.com/'.$projectId;
        $now = time();

        if (($payload['aud'] ?? null) !== $projectId) {
            throw new AuthenticationException('Invalid Firebase token audience.');
        }

        if (($payload['iss'] ?? null) !== $issuer) {
            throw new AuthenticationException('Invalid Firebase token issuer.');
        }

        if (! is_string($payload['sub'] ?? null) || trim((string) $payload['sub']) === '') {
            throw new AuthenticationException('Invalid Firebase token subject.');
        }

        if (($payload['exp'] ?? 0) < $now) {
            throw new AuthenticationException('Firebase token has expired.');
        }

        if (($payload['iat'] ?? 0) > ($now + 300)) {
            throw new AuthenticationException('Firebase token issued-at time is invalid.');
        }
    }

    private function splitJwt(string $token): array
    {
        $segments = explode('.', $token);

        if (count($segments) !== 3) {
            throw new AuthenticationException('Malformed Firebase ID token.');
        }

        return $segments;
    }

    private function decodeJwtSegment(string $segment): array
    {
        $decoded = json_decode($this->decodeBase64Url($segment), true);

        if (! is_array($decoded)) {
            throw new AuthenticationException('Malformed Firebase token payload.');
        }

        return $decoded;
    }

    private function decodeBase64Url(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder > 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        if ($decoded === false) {
            throw new AuthenticationException('Invalid Firebase token encoding.');
        }

        return $decoded;
    }

    private function buildPemFromJwk(array $jwk): string
    {
        $modulus = $this->decodeBase64Url((string) ($jwk['n'] ?? ''));
        $exponent = $this->decodeBase64Url((string) ($jwk['e'] ?? ''));

        if ($modulus === '' || $exponent === '') {
            throw new AuthenticationException('Invalid Firebase signing key.');
        }

        $modulus = $this->asn1Integer($modulus);
        $exponent = $this->asn1Integer($exponent);
        $rsaPublicKey = $this->asn1Sequence($modulus.$exponent);
        $algorithmIdentifier = hex2bin('300d06092a864886f70d0101010500');
        $subjectPublicKeyInfo = $this->asn1Sequence(
            $algorithmIdentifier.$this->asn1BitString($rsaPublicKey)
        );

        return "-----BEGIN PUBLIC KEY-----\n"
            .chunk_split(base64_encode($subjectPublicKeyInfo), 64, "\n")
            ."-----END PUBLIC KEY-----\n";
    }

    private function asn1Integer(string $value): string
    {
        if (ord($value[0]) > 0x7f) {
            $value = "\x00".$value;
        }

        return "\x02".$this->asn1Length(strlen($value)).$value;
    }

    private function asn1BitString(string $value): string
    {
        return "\x03".$this->asn1Length(strlen($value) + 1)."\x00".$value;
    }

    private function asn1Sequence(string $value): string
    {
        return "\x30".$this->asn1Length(strlen($value)).$value;
    }

    private function asn1Length(int $length): string
    {
        if ($length <= 0x7f) {
            return chr($length);
        }

        $temp = ltrim(pack('N', $length), "\x00");

        return chr(0x80 | strlen($temp)).$temp;
    }
}
