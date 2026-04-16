<?php

namespace App\Services\Kitchen;

use App\Enums\OrderItemPrepStatus;
use App\Enums\OrderStatus;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class KitchenDashboardService
{
    public function build(User $user, ?string $reportDate = null): array
    {
        if (! $user->kitchen_id) {
            return [
                'mode' => 'kitchen',
                'branchId' => $user->branch_id,
                'kitchenId' => null,
                'kitchenName' => null,
                'kitchenQueue' => [],
                'kitchenDailyReport' => [],
                'kitchenSummary' => [
                    'pending' => 0,
                    'inProgress' => 0,
                    'ready' => 0,
                    'deliveredToday' => 0,
                ],
                'reportDate' => $reportDate ?? Carbon::today()->toDateString(),
            ];
        }

        $selectedDate = $reportDate ?? Carbon::today()->toDateString();

        $queueItems = OrderItem::query()
            ->with([
                'kitchen:id,name',
                'product:id,name,pashto_name,dari_name',
                'order:id,branch_id,branch_table_id,user_id,order_type,customer_name,customer_phone,delivery_address,customer_note,status,created_at',
                'order.branchTable:id,table_number,title',
                'order.user:id,name',
            ])
            ->where('kitchen_id', $user->kitchen_id)
            ->whereHas('order', function ($query) use ($user) {
                $query->whereNotIn('status', [
                    OrderStatus::COMPLETED->value,
                    OrderStatus::CANCELLED->value,
                ]);

                if ($user->branch_id) {
                    $query->where('branch_id', $user->branch_id);
                }
            })
            ->orderByRaw("case prep_status
                when '".OrderItemPrepStatus::PENDING->value."' then 1
                when '".OrderItemPrepStatus::IN_PROGRESS->value."' then 2
                when '".OrderItemPrepStatus::READY->value."' then 3
                when '".OrderItemPrepStatus::DELIVERED->value."' then 4
                else 5 end")
            ->orderBy('created_at')
            ->get();

        $queueTickets = $this->mapTickets($queueItems);

        $dailyCompletedItems = OrderItem::query()
            ->with([
                'kitchen:id,name',
                'product:id,name,pashto_name,dari_name',
                'order:id,branch_id,branch_table_id,user_id,order_type,customer_name,customer_phone,delivery_address,customer_note,status,created_at',
                'order.branchTable:id,table_number,title',
                'order.user:id,name',
                'preparedBy:id,name',
            ])
            ->where('kitchen_id', $user->kitchen_id)
            ->where(function ($query) use ($selectedDate) {
                $query->whereDate('ready_at', $selectedDate)
                    ->orWhereDate('delivered_at', $selectedDate);
            })
            ->orderByDesc('ready_at')
            ->get();

        $reportTickets = $this->mapTickets($dailyCompletedItems);

        return [
            'mode' => 'kitchen',
            'branchId' => $user->branch_id,
            'kitchenId' => $user->kitchen_id,
            'kitchenName' => $user->kitchen?->name,
            'kitchenQueue' => $queueTickets->values()->all(),
            'kitchenDailyReport' => $reportTickets->values()->all(),
            'kitchenSummary' => [
                'pending' => $queueItems->where('prep_status', OrderItemPrepStatus::PENDING->value)->count(),
                'inProgress' => $queueItems->where('prep_status', OrderItemPrepStatus::IN_PROGRESS->value)->count(),
                'ready' => $queueItems->where('prep_status', OrderItemPrepStatus::READY->value)->count(),
                'deliveredToday' => $dailyCompletedItems
                    ->where('prep_status', OrderItemPrepStatus::DELIVERED->value)
                    ->count(),
            ],
            'reportDate' => $selectedDate,
        ];
    }

    public function assertAssignedKitchen(User $user): void
    {
        if (! $user->kitchen_id && ! $user->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'kitchen' => 'This kitchen account is not assigned to a kitchen yet.',
            ]);
        }
    }

    private function mapTickets(Collection $items): Collection
    {
        return $items
            ->groupBy('order_id')
            ->map(function (Collection $group) {
                /** @var OrderItem $first */
                $first = $group->first();
                $order = $first->order;
                $statusCounts = $group
                    ->groupBy(fn (OrderItem $item) => (string) ($item->prep_status?->value ?? $item->prep_status))
                    ->map->count();

                return [
                    'order_id' => $order?->id,
                    'kitchen_id' => $first->kitchen_id,
                    'kitchen_name' => $first->kitchen?->name,
                    'order_type' => (string) ($order?->order_type?->value ?? $order?->order_type ?? ''),
                    'order_status' => (string) ($order?->status?->value ?? $order?->status ?? ''),
                    'customer_name' => $order?->customer_name,
                    'customer_phone' => $order?->customer_phone,
                    'delivery_address' => $order?->delivery_address,
                    'customer_note' => $order?->customer_note,
                    'table_number' => $order?->branchTable?->table_number,
                    'server_name' => $order?->user?->name,
                    'created_at' => $order?->created_at?->toIso8601String(),
                    'elapsed_label' => $order?->created_at
                        ? Carbon::parse($order->created_at)->diffForHumans(now(), true)
                        : null,
                    'ticket_status' => $this->resolveTicketStatus($statusCounts),
                    'items' => $group->map(function (OrderItem $item) {
                        return [
                            'id' => $item->id,
                            'product_id' => $item->product_id,
                            'name' => $item->product_name_snapshot
                                ?? $item->product?->name,
                            'pashto_name' => $item->product?->pashto_name,
                            'dari_name' => $item->product?->dari_name,
                            'quantity' => (int) $item->quantity,
                            'price' => (float) $item->price,
                            'line_total' => (float) ($item->line_total ?? ($item->quantity * $item->price)),
                            'note' => $item->note,
                            'prep_status' => (string) ($item->prep_status?->value ?? $item->prep_status),
                            'started_at' => $item->started_at?->toIso8601String(),
                            'ready_at' => $item->ready_at?->toIso8601String(),
                            'delivered_at' => $item->delivered_at?->toIso8601String(),
                            'prepared_by' => $item->preparedBy?->name,
                        ];
                    })->values()->all(),
                ];
            });
    }

    private function resolveTicketStatus(Collection $statusCounts): string
    {
        if (($statusCounts[OrderItemPrepStatus::PENDING->value] ?? 0) > 0) {
            return OrderItemPrepStatus::PENDING->value;
        }

        if (($statusCounts[OrderItemPrepStatus::IN_PROGRESS->value] ?? 0) > 0) {
            return OrderItemPrepStatus::IN_PROGRESS->value;
        }

        if (($statusCounts[OrderItemPrepStatus::READY->value] ?? 0) > 0) {
            return OrderItemPrepStatus::READY->value;
        }

        return OrderItemPrepStatus::DELIVERED->value;
    }
}
