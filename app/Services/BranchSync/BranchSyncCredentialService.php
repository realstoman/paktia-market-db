<?php

namespace App\Services\BranchSync;

use App\Models\Branch;
use App\Models\BranchSyncCredential;
use Illuminate\Support\Str;

class BranchSyncCredentialService
{
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
            'token_hash' => hash('sha256', $plainTextToken),
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
        if (! $plainTextToken) {
            return null;
        }

        $credential = BranchSyncCredential::query()
            ->with('branch')
            ->where('token_hash', hash('sha256', trim($plainTextToken)))
            ->whereNull('revoked_at')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();

        if (! $credential || ! $credential->branch?->is_active) {
            return null;
        }

        if ($ability && ! $this->hasAbility($credential, $ability)) {
            return null;
        }

        $credential->forceFill([
            'last_used_at' => now(),
        ])->save();

        return $credential;
    }

    public function revoke(BranchSyncCredential $credential): void
    {
        $credential->forceFill([
            'revoked_at' => now(),
        ])->save();
    }

    private function hasAbility(BranchSyncCredential $credential, string $ability): bool
    {
        $abilities = $credential->abilities ?? [];

        return in_array('*', $abilities, true) || in_array($ability, $abilities, true);
    }
}
