<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use App\Services\Mobile\MobileOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $client = $request->attributes->get('client');

        return response()->json([
            'data' => [
                'id' => $client->id,
                'firebase_uid' => $client->firebase_uid,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'avatar_url' => $client->avatar_url,
            ],
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
}
