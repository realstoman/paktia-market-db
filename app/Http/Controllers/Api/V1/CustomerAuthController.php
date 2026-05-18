<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Services\Mobile\ClientSyncService;
use App\Services\Mobile\FirebaseAuthService;
use App\Services\Web\CustomerSessionCookieService;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerAuthController extends Controller
{
    public function login(
        Request $request,
        FirebaseAuthService $firebaseAuthService,
        ClientSyncService $clientSyncService,
        CustomerSessionCookieService $customerSessionCookieService,
    ): JsonResponse {
        $payload = $request->validate([
            'idToken' => ['required', 'string'],
            'provider' => ['nullable', 'string', 'max:50'],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar_url' => ['nullable', 'url', 'max:2048'],
        ]);

        try {
            $firebaseUser = $firebaseAuthService->verifyIdToken($payload['idToken']);
        } catch (AuthenticationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 401);
        }

        $client = $clientSyncService->sync($firebaseUser, [
            'provider' => $payload['provider'] ?? $firebaseUser['provider'] ?? 'google',
            'name' => $payload['name'] ?? $firebaseUser['name'] ?? null,
            'email' => $payload['email'] ?? $firebaseUser['email'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'avatar_url' => $payload['avatar_url'] ?? $firebaseUser['picture'] ?? null,
        ]);

        return response()->json([
            'customer' => $this->transformClient($client),
        ])->withCookie($customerSessionCookieService->makeCookie($client));
    }

    public function logout(CustomerSessionCookieService $customerSessionCookieService): JsonResponse
    {
        return response()->json([
            'message' => 'Signed out successfully.',
        ])->withCookie($customerSessionCookieService->expireCookie());
    }

    private function transformClient(Client $client): array
    {
        return [
            'id' => $client->id,
            'firebase_uid' => $client->firebase_uid,
            'name' => $client->name,
            'email' => $client->email,
            'phone' => $client->phone,
            'avatar' => $client->avatar_url,
            'created_at' => $client->created_at?->toIso8601String(),
            'favorites_count' => 0,
            'orders_count' => $client->orders()->count(),
            'recent_orders' => $client->orders()
                ->latest('id')
                ->limit(5)
                ->get()
                ->map(fn ($order) => [
                    'id' => $order->id,
                    'code' => $order->sync_uuid,
                    'status' => $order->status?->value ?? $order->status,
                    'total' => (float) $order->total_amount,
                    'created_at' => $order->created_at?->toIso8601String(),
                ])
                ->all(),
        ];
    }
}
