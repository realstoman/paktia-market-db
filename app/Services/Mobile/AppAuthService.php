<?php

namespace App\Services\Mobile;

class AppAuthService
{
    public function validate(?string $appKey, ?string $platform = null): bool
    {
        if (! $appKey) {
            return false;
        }

        $apps = collect(config('mobile.apps', []));

        return $apps->contains(function (array $app) use ($appKey, $platform): bool {
            if (! ($app['active'] ?? false)) {
                return false;
            }

            if (($app['key'] ?? null) !== $appKey) {
                return false;
            }

            if ($platform && ($app['platform'] ?? null) && $app['platform'] !== $platform) {
                return false;
            }

            return true;
        });
    }
}
