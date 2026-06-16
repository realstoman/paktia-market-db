<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sends the freshly-authenticated user straight to the surface they
 * actually use, instead of always bouncing them through /dashboard
 * which then redirects again from DashboardController.
 *
 * For JSON / API style logins the response stays the same as Fortify's
 * default (a 200 status with no body) so the SPA login flow is unchanged.
 */
class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return response()->noContent();
        }

        return redirect()->intended($this->resolveTargetPath($request));
    }

    private function resolveTargetPath(Request $request): string
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return route('dashboard');
        }

        $isSuperAdmin = $user->hasRole('super-admin');

        if ($user->hasRole('finance') && ! $isSuperAdmin) {
            return route('finance.index');
        }

        if ($user->hasRole('inventory') && ! $isSuperAdmin) {
            return route('inventory.index');
        }

        return route('dashboard');
    }
}
