<?php

namespace App\Services\Notifications;

use App\Enums\PermissionEnum;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\NotificationRead;
use App\Models\PayrollRunItem;
use App\Models\User;

class NotificationService
{
    public const MAX_ITEMS = 12;

    public function forUser(User $user, int $limit = self::MAX_ITEMS): array
    {
        $items = collect();

        if ($user->can(PermissionEnum::INVENTORY_VIEW->value)) {
            $items = $items->merge(
                InventoryItem::query()
                    ->where('quantity', '<=', 10)
                    ->latest('updated_at')
                    ->limit(5)
                    ->get()
                    ->map(fn (InventoryItem $item) => [
                        'id' => 'inventory-'.$item->id.'-'.$item->updated_at?->timestamp,
                        'category' => 'inventory',
                        'title' => (float) $item->quantity <= 0 ? 'Inventory item unavailable' : 'Low inventory level',
                        'description' => $item->name.' has '.number_format((float) $item->quantity, 2).' remaining.',
                        'createdAt' => $item->updated_at?->toIso8601String(),
                        'priority' => (float) $item->quantity <= 0 ? 'high' : 'medium',
                        'href' => '/inventory',
                    ]),
            );
        }

        if ($user->can(PermissionEnum::EXPENSES_VIEW->value)) {
            $items = $items->merge(
                Expense::query()
                    ->where('approval_status', 'submitted')
                    ->latest('updated_at')
                    ->limit(4)
                    ->get()
                    ->map(fn (Expense $expense) => [
                        'id' => 'expense-'.$expense->id.'-'.$expense->updated_at?->timestamp,
                        'category' => 'payments',
                        'title' => 'Expense needs review',
                        'description' => $expense->title.' is awaiting approval.',
                        'createdAt' => $expense->updated_at?->toIso8601String(),
                        'priority' => 'medium',
                        'href' => '/finance/expenses',
                    ]),
            );
        }

        if ($user->can(PermissionEnum::PAYROLL_VIEW->value)) {
            $items = $items->merge(
                PayrollRunItem::query()
                    ->with('employee:id,first_name,last_name')
                    ->where('payment_status', 'paid')
                    ->latest('updated_at')
                    ->limit(3)
                    ->get()
                    ->map(fn (PayrollRunItem $item) => [
                        'id' => 'payroll-'.$item->id.'-'.$item->updated_at?->timestamp,
                        'category' => 'salary',
                        'title' => 'Payroll payment recorded',
                        'description' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')) ?: 'Employee payroll was paid.',
                        'createdAt' => $item->updated_at?->toIso8601String(),
                        'priority' => 'low',
                        'href' => '/finance/payroll',
                    ]),
            );
        }

        $readIds = NotificationRead::query()
            ->where('user_id', $user->getKey())
            ->pluck('notification_id')
            ->all();

        return $items
            ->sortByDesc('createdAt')
            ->take($limit)
            ->map(fn (array $item) => [...$item, 'unread' => ! in_array($item['id'], $readIds, true)])
            ->values()
            ->all();
    }

    public function markRead(User $user, string $notificationId): void
    {
        if (trim($notificationId) === '') {
            return;
        }

        NotificationRead::query()->updateOrCreate(
            ['user_id' => $user->getKey(), 'notification_id' => $notificationId],
            ['read_at' => now()],
        );
    }

    public function markAllRead(User $user): int
    {
        $rows = collect($this->forUser($user))
            ->map(fn (array $item) => [
                'user_id' => $user->getKey(),
                'notification_id' => $item['id'],
                'read_at' => now(),
            ])
            ->all();

        if ($rows === []) {
            return 0;
        }

        NotificationRead::query()->upsert($rows, ['user_id', 'notification_id'], ['read_at']);

        return count($rows);
    }
}
