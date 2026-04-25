<?php

namespace App\Services\BranchSync;

use App\Models\Branch;
use App\Models\BranchSyncCredential;
use Illuminate\Support\Str;

class BranchSyncCredentialService
{
    /**
     * Token hash format prefix. Stored hashes are written as
     * "<algo>$<hex>" so the verification path can recognize the
     * scheme without guessing. Legacy hashes (raw 64-char SHA-256
     * hex) are still accepted on read for backward compatibility.
     */
    private const HMAC_PREFIX = 'hmac-sha256$';

    public function issue(
        Branch $branch,
        string $name,
        array $abilities = ['*'],
        ?\DateTimeInterface $expiresAt = null,
    ): array {
        $plainTextToken = Str::random(64);

        $credential = BranchSyncCredential::query()->create([
            'branch_id' => $branch->id,
            'name' => $name,
            'token_hash' => $this->hashToken($plainTextToken),
            'abilities' => $abilities,
            'expires_at' => $expiresAt,
        ]);

        return [
            'credential' => $credential,
            'plain_text_token' => $plainTextToken,
        ];
    }

    public function validate(?string $plainTextToken, ?string $ability = null): ?BranchSyncCredential
    {
        $token = $plainTextToken !== null ? trim($plainTextToken) : '';

        if ($token === '' || ! $this->isAcceptableTokenFormat($token)) {
            return null;
        }

        $hmacHash = $this->hashToken($token);
        $legacyHash = hash('sha256', $token);

        $credential = BranchSyncCredential::query()
            ->with('branch')
            ->whereIn('token_hash', [$hmacHash, $legacyHash])
            ->whereNull('revoked_at')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();

        if (! $credential) {
            return null;
        }

        // Constant-time comparison guards against any caller that ends up
        // exposing token_hash side-channels in custom queries.
        $matchedHmac = hash_equals($hmacHash, (string) $credential->token_hash);
        $matchedLegacy = hash_equals($legacyHash, (string) $credential->token_hash);

        if (! $matchedHmac && ! $matchedLegacy) {
            return null;
        }

        if (! $credential->branch?->is_active) {
            return null;
        }

        if ($ability && ! $this->hasAbility($credential, $ability)) {
            return null;
        }

        $this->touchLastUsed($credential, upgradeLegacyHash: $matchedLegacy ? $hmacHash : null);

        return $credential;
    }

    public function revoke(BranchSyncCredential $credential): void
    {
        $credential->forceFill([
            'revoked_at' => now(),
        ])->save();
    }

    /**
     * Refresh last_used_at no more than once per configured window.
     * Optionally rotates a legacy SHA-256 hash to the HMAC scheme.
     */
    private function touchLastUsed(BranchSyncCredential $credential, ?string $upgradeLegacyHash = null): void
    {
        $throttleSeconds = max(0, (int) config('pos.sync.last_used_throttle_seconds', 60));
        $now = now();
        $shouldTouch = $upgradeLegacyHash !== null
            || $credential->last_used_at === null
            || $throttleSeconds === 0
            || $credential->last_used_at->lt($now->copy()->subSeconds($throttleSeconds));

        if (! $shouldTouch) {
            return;
        }

        $payload = ['last_used_at' => $now];

        if ($upgradeLegacyHash !== null) {
            $payload['token_hash'] = $upgradeLegacyHash;
        }

        $credential->forceFill($payload)->save();
    }

    private function hashToken(string $plainTextToken): string
    {
        $key = (string) config('app.key', '');

        // Strip Laravel's "base64:" prefix so the same key produces the same HMAC
        // regardless of how it was loaded.
        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7), true) ?: substr($key, 7);
        }

        return self::HMAC_PREFIX.hash_hmac('sha256', $plainTextToken, $key);
    }

    private function isAcceptableTokenFormat(string $token): bool
    {
        $minLength = max(1, (int) config('pos.sync.min_token_length', 40));

        // Tokens are random URL-safe alphanumeric strings produced by Str::random.
        return strlen($token) >= $minLength && preg_match('/^[A-Za-z0-9]+$/', $token) === 1;
    }

    private function hasAbility(BranchSyncCredential $credential, string $ability): bool
    {
        $abilities = $credential->abilities ?? [];

        return in_array('*', $abilities, true) || in_array($ability, $abilities, true);
    }
}
