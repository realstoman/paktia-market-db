<?php

namespace App\Services\Order;

use App\Enums\OrderItemPrepStatus;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Collection;

class OrderItemService
{
    public function replaceForOrder(Order $order, array $items): array
    {
        $groupedPayload = collect($this->buildPayload($items))
            ->groupBy(fn (array $item) => $this->signature(
                (int) $item['product_id'],
                $item['product_size_id'] !== null ? (int) $item['product_size_id'] : null,
                (float) $item['price'],
            ));

        $existingItems = $order->items()->get()->groupBy(
            fn (OrderItem $item) => $this->signature(
                (int) $item->product_id,
                $item->product_size_id !== null ? (int) $item->product_size_id : null,
                (float) $item->price,
            ),
        );

        $preservedPayload = [];
        $consumedExistingIds = [];

        foreach ($groupedPayload as $signature => $incomingGroup) {
            $desiredQuantity = (int) collect($incomingGroup)->sum('quantity');
            $prototype = $incomingGroup->first();
            $matchingExisting = $existingItems->get($signature, collect());

            $protectedItems = $matchingExisting
                ->filter(fn (OrderItem $item) => $this->isProtectedKitchenItem($item))
                ->values();

            foreach ($protectedItems as $existingItem) {
                $consumedExistingIds[] = $existingItem->id;
                $preservedPayload[] = $this->existingItemPayload($existingItem);
                $desiredQuantity -= (int) $existingItem->quantity;
            }

            $pendingItems = $matchingExisting
                ->reject(fn (OrderItem $item) => in_array($item->id, $consumedExistingIds, true))
                ->values();

            if ($desiredQuantity > 0) {
                if ($pendingItem = $pendingItems->shift()) {
                    $consumedExistingIds[] = $pendingItem->id;
                    $preservedPayload[] = [
                        ...$this->existingItemPayload($pendingItem),
                        'quantity' => $desiredQuantity,
                        'line_total' => $desiredQuantity * (float) $pendingItem->price,
                    ];
                } else {
                    $preservedPayload[] = [
                        ...$prototype,
                        'quantity' => $desiredQuantity,
                        'line_total' => $desiredQuantity * (float) $prototype['price'],
                    ];
                }
            }
        }

        $order->items()->delete();
        $order->items()->createMany($preservedPayload);

        return $preservedPayload;
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
                'prep_status' => $product?->kitchen_id
                    ? OrderItemPrepStatus::PENDING->value
                    : OrderItemPrepStatus::READY->value,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'line_total' => $item['price'] * $item['quantity'],
                'note' => $item['note'] ?? null,
                'ready_at' => $product?->kitchen_id ? null : now(),
            ];
        })->all();
    }

    private function signature(int $productId, ?int $productSizeId, float $price): string
    {
        return implode(':', [
            $productId,
            $productSizeId ?? 'none',
            number_format($price, 2, '.', ''),
        ]);
    }

    private function isProtectedKitchenItem(OrderItem $item): bool
    {
        $status = (string) ($item->prep_status?->value ?? $item->prep_status ?? OrderItemPrepStatus::PENDING->value);

        return $item->kitchen_id !== null
            && in_array($status, [
                OrderItemPrepStatus::IN_PROGRESS->value,
                OrderItemPrepStatus::READY->value,
                OrderItemPrepStatus::DELIVERED->value,
            ], true);
    }

    private function existingItemPayload(OrderItem $item): array
    {
        return [
            'product_id' => $item->product_id,
            'product_name_snapshot' => $item->product_name_snapshot,
            'product_size_id' => $item->product_size_id,
            'product_size_name_snapshot' => $item->product_size_name_snapshot,
            'kitchen_id' => $item->kitchen_id,
            'prep_status' => (string) ($item->prep_status?->value ?? $item->prep_status),
            'quantity' => (int) $item->quantity,
            'price' => (float) $item->price,
            'line_total' => (float) ($item->line_total ?? ($item->quantity * $item->price)),
            'note' => $item->note,
            'started_at' => $item->started_at,
            'ready_at' => $item->ready_at,
            'delivered_at' => $item->delivered_at,
            'prepared_by' => $item->prepared_by,
            'kitchen_receipt_printed_at' => $item->kitchen_receipt_printed_at,
        ];
    }

    private function getProductsById(array $items): Collection
    {
        return Product::with('sizes')->whereIn(
            'id',
            collect($items)->pluck('product_id')->all(),
        )->get()->keyBy('id');
    }
}
