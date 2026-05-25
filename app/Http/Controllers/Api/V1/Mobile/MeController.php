<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Client;
use App\Models\Order;
use App\Services\Mobile\MobileOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var Client $client */
        $client = $request->attributes->get('client');
        $payload = $this->transformClient($client);

        return response()->json([
            'data' => $payload,
            'customer' => $payload,
        ]);
    }

    public function orders(Request $request, MobileOrderService $mobileOrderService): AnonymousResourceCollection
    {
        $client = $request->attributes->get('client');
        $perPage = min((int) $request->integer('per_page', 15), 50);

        return OrderResource::collection(
            $mobileOrderService->paginateForClient($client, $perPage)
        );
    }

    public function showOrder(Request $request, Order $order, MobileOrderService $mobileOrderService): OrderResource
    {
        $client = $request->attributes->get('client');

        return OrderResource::make(
            $mobileOrderService->getForClient($client, $order)
        );
    }

    public function orderStatus(Request $request, Order $order, MobileOrderService $mobileOrderService): JsonResponse
    {
        $client = $request->attributes->get('client');
        $order = $mobileOrderService->getForClient($client, $order);

        return response()->json([
            'data' => [
                'id' => $order->id,
                'status' => $order->status?->value ?? $order->status,
                'source' => $order->source,
                'updated_at' => $order->updated_at?->toIso8601String(),
                'completed_at' => $order->completed_at?->toIso8601String(),
                'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var Client $client */
        $client = $request->attributes->get('client');

        $payload = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar_url' => ['nullable', 'url', 'max:2048'],
        ]);

        $client->fill($payload);
        $client->save();

        $data = $this->transformClient($client->fresh());

        return response()->json([
            'data' => $data,
            'customer' => $data,
        ]);
    }

    private function transformClient(Client $client): array
    {
        return [
            'id' => $client->id,
            'firebase_uid' => $client->firebase_uid,
            'name' => $client->name,
            'email' => $client->email,
            'phone' => $client->phone,
            'avatar_url' => $client->avatar_url,
            'avatar' => $client->avatar_url,
            'created_at' => $client->created_at?->toIso8601String(),
            'favorites_count' => 0,
            'orders_count' => $client->orders()->count(),
            'recent_orders' => $client->orders()
                ->with([
                    'items.product.images',
                ])
                ->latest('id')
                ->limit(5)
                ->get()
                ->map(fn (Order $order) => [
                    'id' => $order->id,
                    'code' => $order->sync_uuid,
                    'status' => $order->status?->value ?? $order->status,
                    'total' => (float) $order->total_amount,
                    'created_at' => $order->created_at?->toIso8601String(),
                    'items' => $order->items->map(fn ($item) => [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product_name_snapshot ?? $item->product?->name,
                        'product_image_url' => $item->product?->images?->first()?->url,
                        'quantity' => (int) $item->quantity,
                    ])->values()->all(),
                ])
                ->all(),
        ];
    }
}
