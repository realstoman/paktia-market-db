<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\OrderIndexRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use App\Services\Order\OrderApiService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function index(OrderIndexRequest $request, OrderApiService $service): AnonymousResourceCollection
    {
        $orders = $service->paginate($request->validated());

        return OrderResource::collection($orders);
    }

    public function show(Order $order, OrderApiService $service): OrderResource
    {
        return OrderResource::make($service->getById($order));
    }
}
