<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Enums\OrderType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OrderResource;
use App\Services\Mobile\CheckoutService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CheckoutController extends Controller
{
    public function store(Request $request, CheckoutService $checkoutService): OrderResource
    {
        $payload = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'order_type' => ['required', Rule::in([
                OrderType::TAKEAWAY->value,
                OrderType::DELIVERY->value,
            ])],
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'delivery_address' => 'nullable|string|max:2000',
            'customer_note' => 'nullable|string|max:2000',
        ]);

        $order = $checkoutService->checkout(
            $request->attributes->get('client'),
            $payload,
        );

        return OrderResource::make($order);
    }
}
