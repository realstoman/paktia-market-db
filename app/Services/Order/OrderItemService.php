<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Collection;

class OrderItemService
{
    public function createManyForOrder(Order $order, array $items): array
    {
        $payload = $this->buildPayload($items);
        $order->items()->createMany($payload);

        return $payload;
    }

    public function calculateTotal(array $items): int
    {
        return (int) collect($items)->sum(function (array $item) {
            return $item['price'] * $item['quantity'];
        });
    }

    public function calculateTotalFromPayload(array $payload): int
    {
        return (int) collect($payload)->sum(function (array $item) {
            return $item['price'] * $item['quantity'];
        });
    }

    private function buildPayload(array $items): array
    {
        $productsById = $this->getProductsById($items);

        return collect($items)->map(function (array $item) use ($productsById) {
            $product = $productsById->get($item['product_id']);

            return [
                'product_id' => $item['product_id'],
                'product_size_id' => $item['product_size_id'] ?? null,
                'kitchen_id' => $product?->kitchen_id,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
            ];
        })->all();
    }

    private function getProductsById(array $items): Collection
    {
        return Product::whereIn(
            'id',
            collect($items)->pluck('product_id')->all(),
        )->get()->keyBy('id');
    }
}
