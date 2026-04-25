<?php

namespace App\Http\Controllers;

use App\Services\Notifications\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['data' => [], 'meta' => ['unread' => 0]]);
        }

        $items = $this->notificationService->forUser($user, NotificationService::MAX_ITEMS);

        $unread = collect($items)->filter(fn (array $item) => (bool) ($item['unread'] ?? false))->count();

        return response()->json([
            'data' => $items,
            'meta' => [
                'unread' => $unread,
                'total' => count($items),
            ],
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $this->notificationService->markRead($user, $id);

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $count = $this->notificationService->markAllRead($user);

        return response()->json([
            'ok' => true,
            'updated' => $count,
        ]);
    }
}
