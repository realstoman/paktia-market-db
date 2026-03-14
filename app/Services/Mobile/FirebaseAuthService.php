<?php

namespace App\Services\Mobile;

use Illuminate\Auth\AuthenticationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

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

        throw new HttpException(501, 'Firebase token verification is not configured yet.');
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
            'email_verified' => false,
        ];
    }
}
