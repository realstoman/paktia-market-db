<?php

namespace App\Services\Notifications;

use App\Enums\PermissionEnum;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Lease;
use App\Models\NotificationRead;
use App\Models\PayrollRunItem;
use App\Models\RentPayment;
use App\Models\User;
use Carbon\CarbonImmutable;

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
                        'title' => (float) $item->quantity <= 0
                            ? __('notifications.generated.inventory_unavailable_title')
                            : __('notifications.generated.low_inventory_title'),
                        'description' => __('notifications.generated.inventory_remaining_description', [
                            'name' => $item->name,
                            'quantity' => number_format((float) $item->quantity, 2),
                        ]),
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
                        'title' => __('notifications.generated.expense_review_title'),
                        'description' => __('notifications.generated.expense_review_description', [
                            'title' => $expense->title,
                        ]),
                        'createdAt' => $expense->updated_at?->toIso8601String(),
                        'priority' => 'medium',
                        'href' => '/finance/expenses',
                    ]),
            );
        }

        if ($user->can(PermissionEnum::FINANCE_VIEW->value)) {
            $items = $items->merge($this->rentDueNotifications());
        }

        if ($user->can(PermissionEnum::PAYROLL_VIEW->value)) {
            $items = $items->merge(
                PayrollRunItem::query()
                    ->with('employee:id,first_name,last_name')
                    ->where('payment_status', 'paid')
                    ->latest('updated_at')
                    ->limit(3)
                    ->get()
                    ->map(function (PayrollRunItem $item) {
                        $employeeName = trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? ''));

                        return [
                            'id' => 'payroll-'.$item->id.'-'.$item->updated_at?->timestamp,
                            'category' => 'salary',
                            'title' => __('notifications.generated.payroll_recorded_title'),
                            'description' => $employeeName !== ''
                                ? __('notifications.generated.payroll_recorded_description', ['name' => $employeeName])
                                : __('notifications.generated.payroll_recorded_fallback'),
                            'createdAt' => $item->updated_at?->toIso8601String(),
                            'priority' => 'low',
                            'href' => '/finance/payroll',
                        ];
                    }),
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

    private function rentDueNotifications()
    {
        $today = CarbonImmutable::now();

        if ($today->day !== 1) {
            return collect();
        }

        $monthStart = $today->startOfMonth();
        $monthEnd = $today->endOfMonth();

        return Lease::query()
            ->with([
                'tenant:id,full_name,business_name',
                'property:id,name',
                'unit:id,unit_number,unit_type',
                'currency:id,code,symbol',
            ])
            ->where('status', 'active')
            ->whereNotNull('rent_amount')
            ->whereDate('start_date', '<=', $monthEnd->toDateString())
            ->where(fn ($query) => $query
                ->whereNull('end_date')
                ->orWhereDate('end_date', '>=', $monthStart->toDateString()))
            ->latest('updated_at')
            ->limit(8)
            ->get()
            ->filter(function (Lease $lease) use ($monthStart, $monthEnd): bool {
                $paid = (float) RentPayment::query()
                    ->where('lease_id', $lease->id)
                    ->where('status', 'received')
                    ->whereDate('period_start', '<=', $monthEnd->toDateString())
                    ->where(fn ($query) => $query
                        ->whereDate('period_end', '>=', $monthStart->toDateString())
                        ->orWhere(fn ($singlePeriod) => $singlePeriod
                            ->whereNull('period_end')
                            ->whereDate('period_start', '>=', $monthStart->toDateString())
                            ->whereDate('period_start', '<=', $monthEnd->toDateString())))
                    ->sum('amount');

                return $paid < (float) $lease->rent_amount;
            })
            ->map(function (Lease $lease) use ($today) {
                $tenant = $lease->tenant?->business_name ?: $lease->tenant?->full_name ?: '-';
                $space = $lease->unit?->unit_number ?: $lease->property?->name ?: '-';

                return [
                    'id' => 'rent-due-'.$today->format('Y-m').'-'.$lease->id,
                    'category' => 'payments',
                    'title' => __('notifications.generated.rent_due_title'),
                    'description' => __('notifications.generated.rent_due_description', [
                        'tenant' => $tenant,
                        'space' => $space,
                    ]),
                    'createdAt' => $today->toIso8601String(),
                    'priority' => 'high',
                    'href' => '/finance/rentals?property_id='.$lease->property_id,
                ];
            });
    }
}
