<?php

namespace App\Http\Middleware;

use App\Models\Client;
use App\Services\Mobile\FirebaseAuthService;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveFirebaseUser
{
    public function __construct(private readonly FirebaseAuthService $firebaseAuthService) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->bearerToken()) {
            return $next($request);
        }

        try {
            $firebaseUser = $this->firebaseAuthService->verifyIdToken($request->bearerToken());
        } catch (AuthenticationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 401);
        }

        $request->attributes->set('firebaseUser', $firebaseUser);

        $client = Client::query()
            ->where('firebase_uid', $firebaseUser['uid'])
            ->first();

        if ($client) {
            $request->attributes->set('client', $client);
        }

        return $next($request);
    }
}
