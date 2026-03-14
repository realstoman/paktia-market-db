<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Http\Controllers\Controller;
use App\Services\Mobile\GuestSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestSessionController extends Controller
{
    public function store(Request $request, GuestSessionService $guestSessionService): JsonResponse
    {
        $payload = $request->validate([
            'device_id' => 'nullable|string|max:255',
            'platform' => 'nullable|string|max:50',
            'app_version' => 'nullable|string|max:50',
        ]);

        $guestSession = $guestSessionService->create($payload);

        return response()->json([
            'data' => [
                'guest_token' => $guestSession->token,
                'expires_at' => $guestSession->expires_at?->toIso8601String(),
                'guest_session' => [
                    'id' => $guestSession->id,
                    'platform' => $guestSession->platform,
                    'device_id' => $guestSession->device_id,
                ],
            ],
        ], 201);
    }
}
