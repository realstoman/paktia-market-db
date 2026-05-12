<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerMeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var Client $client */
        $client = $request->attributes->get('client');

        return response()->json([
            'customer' => $this->transformClient($client),
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        /** @var Client $client */
        $client = $request->attributes->get('client');
        $perPage = min((int) $request->integer('per_page', 15), 50);

        $orders = Order::query()
            ->where('client_id', $client->id)
            ->with(['items.product', 'items.productSize'])
            ->latest('id')
            ->paginate($perPage)
            ->through(fn (Order $order) => [
                'id' => $order->id,
                'code' => $order->sync_uuid,
                'status' => $order->status?->value ?? $order->status,
                'total' => (float) $order->total_amount,
                'created_at' => $order->created_at?->toIso8601String(),
                'items_count' => $order->items->count(),
            ]);

        return response()->json($orders);
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
            'favorites_count' => 0,
            'orders_count' => $client->orders()->count(),
            'recent_orders' => $client->orders()
                ->latest('id')
                ->limit(5)
                ->get()
                ->map(fn (Order $order) => [
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
