<?php

namespace App\Http\Middleware;

use App\Services\Mobile\FirebaseAuthService;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateFirebaseUser
{
    public function __construct(private readonly FirebaseAuthService $firebaseAuthService) {}

    public function handle(Request $request, Closure $next): Response
    {
        try {
            $firebaseUser = $this->firebaseAuthService->verifyIdToken($request->bearerToken());
        } catch (AuthenticationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 401);
        }

        $request->attributes->set('firebaseUser', $firebaseUser);

        return $next($request);
    }
}
