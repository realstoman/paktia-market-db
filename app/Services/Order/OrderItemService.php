<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Collection;

class OrderItemService
{
    public function replaceForOrder(Order $order, array $items): array
    {
        $payload = $this->buildPayload($items);

        $order->items()->delete();
        $order->items()->createMany($payload);

        return $payload;
    }

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
            $productSize = $product?->sizes->firstWhere('id', $item['product_size_id'] ?? null);

            return [
                'product_id' => $item['product_id'],
                'product_name_snapshot' => $product?->name,
                'product_size_id' => $item['product_size_id'] ?? null,
                'product_size_name_snapshot' => $productSize?->name,
                'kitchen_id' => $product?->kitchen_id,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'line_total' => $item['price'] * $item['quantity'],
                'note' => $item['note'] ?? null,
            ];
        })->all();
    }

    private function getProductsById(array $items): Collection
    {
        return Product::with('sizes')->whereIn(
            'id',
            collect($items)->pluck('product_id')->all(),
        )->get()->keyBy('id');
    }
}
