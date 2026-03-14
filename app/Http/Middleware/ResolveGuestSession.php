<?php

namespace App\Http\Middleware;

use App\Services\Mobile\GuestSessionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveGuestSession
{
    public function __construct(private readonly GuestSessionService $guestSessionService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $guestToken = $request->header('X-Guest-Token');

        if ($guestToken) {
            $guestSession = $this->guestSessionService->findActiveByToken($guestToken);

            if (! $guestSession) {
                return response()->json([
                    'message' => 'Invalid or expired guest session.',
                ], 401);
            }

            $request->attributes->set('guestSession', $guestSession);
        }

        return $next($request);
    }
}
