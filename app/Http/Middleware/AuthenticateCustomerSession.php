<?php

namespace App\Http\Middleware;

use App\Services\Mobile\FirebaseAuthService;
use App\Services\Web\CustomerSessionCookieService;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateCustomerSession
{
    public function __construct(
        private readonly CustomerSessionCookieService $customerSessionCookieService,
        private readonly FirebaseAuthService $firebaseAuthService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $client = $this->customerSessionCookieService->resolveClientFromRequest($request);

        if ($client) {
            $request->attributes->set('client', $client);

            return $next($request);
        }

        $token = $request->bearerToken();

        if ($token) {
            try {
                $firebaseUser = $this->firebaseAuthService->verifyIdToken($token);
            } catch (AuthenticationException $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                ], 401);
            }

            $request->attributes->set('firebaseUser', $firebaseUser);
            $client = \App\Models\Client::query()
                ->where('firebase_uid', $firebaseUser['uid'])
                ->where('is_active', true)
                ->first();

            if (! $client) {
                return response()->json([
                    'message' => 'Authenticated client context is required.',
                ], 401);
            }

            $request->attributes->set('client', $client);

            return $next($request);
        }

        return response()->json([
            'message' => 'Authenticated customer session is required.',
        ], 401);

    }
}
