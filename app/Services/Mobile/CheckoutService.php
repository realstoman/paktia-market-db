<?php

namespace App\Services\Mobile;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Cart;
use App\Models\Client;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(private readonly CartService $cartService) {}

    public function checkout(
        Client $client,
        array $payload,
        string $source = 'mobile_app',
    ): Order
    {
        $cart = $this->cartService->getOrCreateForClient($client);
        $cart = $this->cartService->refreshTotals($cart);

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'The cart is empty.',
            ]);
        }

        if (($payload['order_type'] ?? null) === OrderType::DELIVERY->value) {
            if (empty(trim((string) ($payload['customer_phone'] ?? $client->phone ?? '')))) {
                throw ValidationException::withMessages([
                    'customer_phone' => 'Customer phone is required for delivery orders.',
                ]);
            }

            if (empty(trim((string) ($payload['delivery_address'] ?? '')))) {
                throw ValidationException::withMessages([
                    'delivery_address' => 'Delivery address is required for delivery orders.',
                ]);
            }
        }

        return DB::transaction(function () use ($cart, $client, $payload, $source) {
            $order = Order::create([
                'branch_id' => $payload['branch_id'],
                'client_id' => $client->id,
                'order_type' => $payload['order_type'],
                'source' => $source,
                'customer_name' => $payload['customer_name'] ?? $client->name,
                'customer_phone' => $payload['customer_phone'] ?? $client->phone,
                'delivery_address' => $payload['delivery_address'] ?? null,
                'customer_note' => $payload['customer_note'] ?? null,
                'base_currency' => $cart->currency_code ?? 'AFN',
                'exchange_rate' => null,
                'sub_total_amount' => $cart->subtotal,
                'discount_amount' => $cart->discount_total,
                'tax_amount' => 0,
                'service_charge_amount' => 0,
                'total_amount' => $cart->total,
                'paid_amount' => 0,
                'change_amount' => 0,
                'refund_amount' => 0,
                'status' => OrderStatus::PENDING->value,
            ]);

            $order->items()->createMany(
                $cart->items->map(function ($item) {
                    return [
                        'product_id' => $item->product_id,
                        'product_name_snapshot' => $item->product?->name,
                        'product_size_id' => $item->product_size_id,
                        'product_size_name_snapshot' => $item->productSize?->name,
                        'kitchen_id' => $item->product?->kitchen_id,
                        'quantity' => $item->quantity,
                        'price' => $item->unit_price,
                        'line_total' => $item->line_total,
                        'note' => $item->note,
                    ];
                })->all()
            );

            $cart->items()->delete();
            $cart->update([
                'status' => 'checked_out',
                'checked_out_at' => now(),
                'subtotal' => 0,
                'discount_total' => 0,
                'delivery_fee' => 0,
                'total' => 0,
            ]);

            return $order->load([
                'branch',
                'client',
                'items.product.category',
                'items.productSize',
                'items.kitchen',
            ])->loadCount('items');
        });
    }
}
