<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Http\Controllers\Controller;
use App\Services\Mobile\ClientSyncService;
use App\Services\Mobile\FirebaseAuthService;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function firebaseSync(
        Request $request,
        FirebaseAuthService $firebaseAuthService,
        ClientSyncService $clientSyncService,
    ): JsonResponse {
        $payload = $request->validate([
            'provider' => 'nullable|string|max:50',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'avatar_url' => 'nullable|url|max:2048',
        ]);

        try {
            $firebaseUser = $firebaseAuthService->verifyIdToken($request->bearerToken());
        } catch (AuthenticationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 401);
        }

        $client = $clientSyncService->sync($firebaseUser, $payload);

        return response()->json([
            'data' => [
                'client' => [
                    'id' => $client->id,
                    'firebase_uid' => $client->firebase_uid,
                    'name' => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'provider' => $client->provider,
                    'avatar_url' => $client->avatar_url,
                ],
                'guest_session' => [
                    'token' => $request->header('X-Guest-Token'),
                    'merge_pending' => $request->filledHeader('X-Guest-Token'),
                ],
            ],
        ]);
    }
}
