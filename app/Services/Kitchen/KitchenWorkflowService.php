<?php

namespace App\Services\Kitchen;

use App\Enums\OrderItemPrepStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class KitchenWorkflowService
{
    public function markInProgress(OrderItem $item, User $actor): void
    {
        $this->assertKitchenAccess($item, $actor);

        $item->update([
            'prep_status' => OrderItemPrepStatus::IN_PROGRESS->value,
            'started_at' => $item->started_at ?? now(),
            'prepared_by' => $actor->id,
        ]);

        $this->syncOrderKitchenStatus($item->order()->firstOrFail());
    }

    public function markReady(OrderItem $item, User $actor): void
    {
        $this->assertKitchenAccess($item, $actor);

        $item->update([
            'prep_status' => OrderItemPrepStatus::READY->value,
            'started_at' => $item->started_at ?? now(),
            'ready_at' => now(),
            'prepared_by' => $actor->id,
            'kitchen_receipt_printed_at' => now(),
        ]);

        $this->syncOrderKitchenStatus($item->order()->firstOrFail());
    }

    public function markDelivered(OrderItem $item, User $actor): void
    {
        $this->assertKitchenAccess($item, $actor);

        $item->update([
            'prep_status' => OrderItemPrepStatus::DELIVERED->value,
            'started_at' => $item->started_at ?? now(),
            'ready_at' => $item->ready_at ?? now(),
            'delivered_at' => now(),
            'prepared_by' => $actor->id,
        ]);

        $this->syncOrderKitchenStatus($item->order()->firstOrFail());
    }

    public function syncOrderKitchenStatus(Order $order): void
    {
        $kitchenItems = $order->items()
            ->whereNotNull('kitchen_id')
            ->get();

        if ($kitchenItems->isEmpty()) {
            return;
        }

        $currentStatus = (string) ($order->status?->value ?? $order->status);

        if (in_array($currentStatus, [
            OrderStatus::COMPLETED->value,
            OrderStatus::CANCELLED->value,
        ], true)) {
            return;
        }

        $statuses = $kitchenItems->map(
            fn (OrderItem $item) => (string) ($item->prep_status?->value ?? $item->prep_status),
        );

        if ($statuses->every(fn (string $status) => in_array($status, [
            OrderItemPrepStatus::READY->value,
            OrderItemPrepStatus::DELIVERED->value,
        ], true))) {
            $order->update([
                'status' => OrderStatus::READY->value,
            ]);

            return;
        }

        if ($statuses->contains(fn (string $status) => in_array($status, [
            OrderItemPrepStatus::IN_PROGRESS->value,
            OrderItemPrepStatus::READY->value,
            OrderItemPrepStatus::DELIVERED->value,
        ], true))) {
            $order->update([
                'status' => OrderStatus::IN_PROGRESS->value,
            ]);

            return;
        }

        $order->update([
            'status' => OrderStatus::PENDING->value,
        ]);
    }

    private function assertKitchenAccess(OrderItem $item, User $actor): void
    {
        if (! $actor->hasRole('kitchen') && ! $actor->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'order_item' => 'Only kitchen staff can update kitchen item status.',
            ]);
        }

        if (! $item->kitchen_id) {
            throw ValidationException::withMessages([
                'order_item' => 'This item is not assigned to a kitchen.',
            ]);
        }

        if ($actor->hasRole('super-admin')) {
            return;
        }

        if (! $actor->kitchen_id || (int) $actor->kitchen_id !== (int) $item->kitchen_id) {
            throw ValidationException::withMessages([
                'order_item' => 'This kitchen account can only manage its assigned kitchen items.',
            ]);
        }
    }
}
