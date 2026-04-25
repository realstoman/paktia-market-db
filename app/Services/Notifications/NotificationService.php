<?php

namespace App\Services\Notifications;

use App\Enums\PermissionEnum;
use App\Models\CashMovement;
use App\Models\Employee;
use App\Models\EmployeeAdvance;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\NotificationRead;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PayrollRun;
use App\Models\PayrollRunItem;
use App\Models\Product;
use App\Models\User;
use App\Support\AfghanCalendar;
use App\Support\Performance\SchemaCache;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class NotificationService
{
    public const AGGREGATED_TTL_SECONDS = 30;

    public const MAX_ITEMS = 12;

    /**
     * Returns the deduped, capped, read-state-hydrated notification list
     * for a user. The expensive DB aggregation is cached for AGGREGATED_TTL_SECONDS;
     * read state is layered on top per request because it is cheap.
     *
     * @return array<int, array<string, mixed>>
     */
    public function forUser(User $user, int $limit = self::MAX_ITEMS): array
    {
        $aggregated = $this->cachedAggregatedNotifications($user);

        $hydrated = $this->hydrateReadState($user, $aggregated);

        return collect($hydrated)
            ->sortByDesc('createdAt')
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * Mark a single notification id as read for a user. Idempotent.
     */
    public function markRead(User $user, string $notificationId): void
    {
        if (trim($notificationId) === '') {
            return;
        }

        NotificationRead::query()->updateOrCreate(
            [
                'user_id' => $user->getKey(),
                'notification_id' => $notificationId,
            ],
            ['read_at' => now()],
        );
    }

    /**
     * Mark every notification currently visible to the user as read.
     */
    public function markAllRead(User $user): int
    {
        $current = $this->forUser($user, self::MAX_ITEMS);

        if (empty($current)) {
            return 0;
        }

        $now = now();
        $rows = collect($current)
            ->map(fn (array $notification) => [
                'user_id' => $user->getKey(),
                'notification_id' => (string) ($notification['id'] ?? ''),
                'read_at' => $now,
            ])
            ->filter(fn (array $row) => $row['notification_id'] !== '')
            ->values()
            ->all();

        if (empty($rows)) {
            return 0;
        }

        NotificationRead::query()->upsert(
            $rows,
            ['user_id', 'notification_id'],
            ['read_at'],
        );

        return count($rows);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function cachedAggregatedNotifications(User $user): array
    {
        $key = sprintf(
            'notifications:aggregated:u%d:b%s:r%s',
            $user->getKey(),
            (string) ($user->branch_id ?? '0'),
            sha1($user->roles->pluck('name')->sort()->implode('|')),
        );

        return Cache::remember(
            $key,
            self::AGGREGATED_TTL_SECONDS,
            fn () => $this->aggregatedNotifications($user),
        );
    }

    /**
     * Apply persisted read_at lookups onto the cached aggregated list.
     * Cached `unread` derived from createdAt is kept as a fallback when no
     * persisted record exists.
     *
     * @param  array<int, array<string, mixed>>  $notifications
     * @return array<int, array<string, mixed>>
     */
    private function hydrateReadState(User $user, array $notifications): array
    {
        if (empty($notifications) || ! SchemaCache::hasTable('notification_reads')) {
            return $notifications;
        }

        $ids = array_values(array_filter(array_map(
            fn (array $notification) => (string) ($notification['id'] ?? ''),
            $notifications,
        )));

        if (empty($ids)) {
            return $notifications;
        }

        $readAt = NotificationRead::query()
            ->where('user_id', $user->getKey())
            ->whereIn('notification_id', $ids)
            ->pluck('read_at', 'notification_id');

        return array_map(function (array $notification) use ($readAt) {
            $id = (string) ($notification['id'] ?? '');
            $persistedReadAt = $readAt->get($id);

            if ($persistedReadAt !== null) {
                $notification['readAt'] = $persistedReadAt instanceof \DateTimeInterface
                    ? $persistedReadAt->format(\DateTimeInterface::ATOM)
                    : (string) $persistedReadAt;
                $notification['unread'] = false;
            } else {
                $notification['readAt'] = null;
                $notification['unread'] = (bool) ($notification['unread'] ?? false);
            }

            return $notification;
        }, $notifications);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function aggregatedNotifications(User $user): array
    {
        return collect()
            ->merge($this->recentOrderNotifications($user))
            ->merge($this->recentPaymentNotifications($user))
            ->merge($this->recentPayrollNotifications($user))
            ->merge($this->recentPayrollPaymentNotifications($user))
            ->merge($this->recentAdvanceNotifications($user))
            ->merge($this->recentExpenseNotifications($user))
            ->merge($this->recentCashMovementNotifications($user))
            ->merge($this->recentEmployeeNotifications($user))
            ->merge($this->recentInventoryNotifications($user))
            ->merge($this->recentProductNotifications($user))
            ->merge($this->recentUserNotifications($user))
            ->sortByDesc('createdAt')
            ->take(self::MAX_ITEMS * 2)
            ->values()
            ->all();
    }

    private function recentOrderNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('orders') || ! $this->canSeeOrderNotifications($user)) {
            return collect();
        }

        $showBranchOrders = $this->shouldSeeBranchOrderNotifications($user);

        return Order::query()
            ->with(['branch:id,name', 'branchTable:id,table_number', 'user:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->when(
                ! $this->isSuperAdmin($user) && ! $showBranchOrders,
                fn ($query) => $query->where('user_id', $user->id),
            )
            ->latest('updated_at')
            ->take(6)
            ->get()
            ->map(function (Order $order) {
                $status = (string) ($order->status?->value ?? $order->status ?? 'pending');
                $statusLabel = Str::of($status)->replace('_', ' ')->title()->value();

                return [
                    'id' => "order-{$order->id}-".($order->updated_at?->timestamp ?? $order->created_at?->timestamp ?? $order->id),
                    'category' => 'orders',
                    'title' => __('notifications.orders.title'),
                    'description' => __('notifications.orders.description', [
                        'id' => $order->id,
                        'table' => $order->branchTable?->table_number
                            ? __('notifications.orders.table_segment', [
                                'table' => $order->branchTable->table_number,
                            ])
                            : '',
                        'user' => $order->user?->name
                            ? __('notifications.orders.user_segment', [
                                'user' => $order->user->name,
                            ])
                            : '',
                    ]),
                    'createdAt' => ($order->updated_at ?? $order->created_at)?->toIso8601String(),
                    'meta' => trim(collect([
                        $order->branch?->name,
                        $statusLabel,
                        $order->total_amount !== null
                            ? __('notifications.orders.total_meta', [
                                'amount' => number_format((float) $order->total_amount, 0),
                            ])
                            : null,
                    ])->filter()->join(' • ')),
                    'href' => '/orders',
                    'priority' => 'high',
                    'unread' => ($order->updated_at ?? $order->created_at)?->gt(now()->subHours(12)) ?? false,
                ];
            });
    }

    private function recentPaymentNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('payments') || ! $this->canSeePaymentNotifications($user)) {
            return collect();
        }

        $href = $this->paymentNotificationHref($user);

        return Payment::query()
            ->with(['order:id,total_amount,branch_id,user_id', 'order.branch:id,name', 'receiver:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->whereHas('order', fn ($orderQuery) => $orderQuery->where('branch_id', $user->branch_id)),
            )
            ->latest('payment_date')
            ->take(4)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => "payment-{$payment->id}",
                'category' => 'payments',
                'title' => __('notifications.payments.title'),
                'description' => __('notifications.payments.description', [
                    'method' => strtoupper((string) $payment->method ?: __('notifications.payments.method_fallback')),
                    'order' => $payment->order_id
                        ? __('notifications.payments.order_segment', [
                            'order' => $payment->order_id,
                        ])
                        : '',
                    'user' => $payment->receiver?->name
                        ? __('notifications.payments.user_segment', [
                            'user' => $payment->receiver->name,
                        ])
                        : '',
                ]),
                'createdAt' => ($payment->payment_date ?? $payment->created_at)?->toIso8601String(),
                'meta' => trim(collect([
                    $payment->order?->branch?->name,
                    $payment->currency ? strtoupper((string) $payment->currency) : null,
                    $payment->amount !== null ? '؋ '.number_format((float) $payment->amount, 0) : null,
                ])->filter()->join(' • ')),
                'href' => $href,
                'priority' => 'medium',
                'unread' => ($payment->payment_date ?? $payment->created_at)?->gt(now()->subHours(12)) ?? false,
            ]);
    }

    private function recentPayrollNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('payroll_runs') || ! $this->hasAnyPermission($user, [
            PermissionEnum::PAYROLL_VIEW->value,
            PermissionEnum::PAYROLL_CREATE->value,
            PermissionEnum::PAYROLL_APPROVE->value,
            PermissionEnum::PAYROLL_PAY->value,
        ])) {
            return collect();
        }

        return PayrollRun::query()
            ->with(['branch:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->withCount('items')
            ->latest()
            ->take(3)
            ->get()
            ->map(fn (PayrollRun $payrollRun) => [
                'id' => "payroll-{$payrollRun->id}",
                'category' => 'salary',
                'title' => __('notifications.salary.title'),
                'description' => __('notifications.salary.description', [
                    'id' => $payrollRun->id,
                    'count' => $payrollRun->items_count,
                    'status' => str_replace('_', ' ', strtolower((string) $payrollRun->status)),
                ]),
                'createdAt' => ($payrollRun->paid_at ?? $payrollRun->approved_at ?? $payrollRun->created_at)?->toIso8601String(),
                'meta' => trim(collect([
                    $payrollRun->branch?->name,
                    $payrollRun->period_start && $payrollRun->period_end
                        ? AfghanCalendar::formatMonthLabel($payrollRun->period_end)
                        : null,
                ])->filter()->join(' • ')),
                'priority' => 'high',
                'unread' => ($payrollRun->paid_at ?? $payrollRun->approved_at ?? $payrollRun->created_at)?->gt(now()->subDay()) ?? false,
            ]);
    }

    private function recentPayrollPaymentNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('payroll_run_items') || ! $this->hasAnyPermission($user, [
            PermissionEnum::PAYROLL_VIEW->value,
            PermissionEnum::PAYROLL_PAY->value,
        ])) {
            return collect();
        }

        return PayrollRunItem::query()
            ->with(['employee:id,first_name,last_name,branch_id', 'employee.branch:id,name', 'payrollRun:id,branch_id'])
            ->where('payment_status', 'paid')
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->whereHas('payrollRun', fn ($runQuery) => $runQuery->where('branch_id', $user->branch_id)),
            )
            ->latest('payment_date')
            ->take(4)
            ->get()
            ->map(function (PayrollRunItem $item) {
                $employeeName = trim((string) (($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')));

                return [
                    'id' => "payroll-item-{$item->id}-".($item->payment_date?->timestamp ?? $item->updated_at?->timestamp ?? $item->id),
                    'category' => 'salary',
                    'title' => 'Salary paid',
                    'description' => $employeeName !== ''
                        ? "Salary payment recorded for {$employeeName}."
                        : 'Salary payment recorded.',
                    'createdAt' => ($item->payment_date ?? $item->updated_at ?? $item->created_at)?->toIso8601String(),
                    'meta' => trim(collect([
                        $item->employee?->branch?->name,
                        $item->net_salary !== null ? '؋ '.number_format((float) $item->net_salary, 0) : null,
                    ])->filter()->join(' • ')),
                    'href' => '/finance/payroll',
                    'priority' => 'high',
                    'unread' => ($item->payment_date ?? $item->updated_at ?? $item->created_at)?->gt(now()->subDay()) ?? false,
                ];
            });
    }

    private function recentAdvanceNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('employee_advances') || ! $this->hasAnyPermission($user, [
            PermissionEnum::FINANCE_VIEW->value,
            PermissionEnum::FINANCE_MANAGE->value,
            PermissionEnum::PAYROLL_VIEW->value,
            PermissionEnum::PAYROLL_APPROVE->value,
        ])) {
            return collect();
        }

        return EmployeeAdvance::query()
            ->with(['employee:id,first_name,last_name', 'branch:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->latest('updated_at')
            ->take(4)
            ->get()
            ->map(function (EmployeeAdvance $advance) {
                $employeeName = trim((string) (($advance->employee?->first_name ?? '').' '.($advance->employee?->last_name ?? '')));
                $status = Str::of((string) ($advance->status ?? 'draft'))->replace('_', ' ')->lower()->value();

                return [
                    'id' => "advance-{$advance->id}-".($advance->updated_at?->timestamp ?? $advance->created_at?->timestamp ?? $advance->id),
                    'category' => 'salary',
                    'title' => 'Employee advance update',
                    'description' => $employeeName !== ''
                        ? "Advance for {$employeeName} is {$status}."
                        : "Employee advance is {$status}.",
                    'createdAt' => ($advance->updated_at ?? $advance->created_at)?->toIso8601String(),
                    'meta' => trim(collect([
                        $advance->branch?->name,
                        $advance->amount !== null ? '؋ '.number_format((float) $advance->amount, 0) : null,
                    ])->filter()->join(' • ')),
                    'href' => '/finance/employee-advances',
                    'priority' => in_array($advance->status, ['approved', 'rejected'], true) ? 'high' : 'medium',
                    'unread' => ($advance->updated_at ?? $advance->created_at)?->gt(now()->subDay()) ?? false,
                ];
            });
    }

    private function recentExpenseNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('expenses') || ! $this->hasAnyPermission($user, [
            PermissionEnum::FINANCE_VIEW->value,
            PermissionEnum::FINANCE_MANAGE->value,
            PermissionEnum::EXPENSES_VIEW->value,
            PermissionEnum::EXPENSES_CREATE->value,
        ])) {
            return collect();
        }

        return Expense::query()
            ->with(['branch:id,name', 'vendor:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->latest('updated_at')
            ->take(4)
            ->get()
            ->map(function (Expense $expense) {
                $status = (string) ($expense->approval_status ?? 'draft');
                $title = match ($status) {
                    'approved' => 'Expense approved',
                    'cancelled' => 'Expense cancelled',
                    'submitted' => 'Expense submitted',
                    default => 'Expense recorded',
                };

                return [
                    'id' => "expense-{$expense->id}-".($expense->updated_at?->timestamp ?? $expense->created_at?->timestamp ?? $expense->id),
                    'category' => 'payments',
                    'title' => $title,
                    'description' => $expense->title
                        ? "Expense \"{$expense->title}\" is ".Str::of($status)->replace('_', ' ')->lower()->value().'.'
                        : 'An expense entry was updated.',
                    'createdAt' => ($expense->updated_at ?? $expense->created_at)?->toIso8601String(),
                    'meta' => trim(collect([
                        $expense->branch?->name,
                        $expense->vendor?->name,
                        $expense->amount !== null ? '؋ '.number_format((float) $expense->amount, 0) : null,
                    ])->filter()->join(' • ')),
                    'href' => '/finance/expenses',
                    'priority' => in_array($status, ['approved', 'cancelled'], true) ? 'high' : 'medium',
                    'unread' => ($expense->updated_at ?? $expense->created_at)?->gt(now()->subDay()) ?? false,
                ];
            });
    }

    private function recentCashMovementNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('cash_movements') || ! $this->hasAnyPermission($user, [
            PermissionEnum::FINANCE_VIEW->value,
            PermissionEnum::FINANCE_MANAGE->value,
            PermissionEnum::PAYMENTS_VIEW->value,
            PermissionEnum::PAYMENTS_CREATE->value,
        ])) {
            return collect();
        }

        return CashMovement::query()
            ->with(['branch:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->latest('updated_at')
            ->take(4)
            ->get()
            ->map(fn (CashMovement $movement) => [
                'id' => "cash-movement-{$movement->id}-".($movement->updated_at?->timestamp ?? $movement->created_at?->timestamp ?? $movement->id),
                'category' => 'payments',
                'title' => 'Cash movement activity',
                'description' => 'Cash movement '.Str::of((string) ($movement->approval_status ?? 'draft'))->replace('_', ' ')->lower()->value().' for '.Str::of((string) ($movement->movement_type ?? 'movement'))->replace('_', ' ')->lower()->value().'.',
                'createdAt' => ($movement->updated_at ?? $movement->created_at)?->toIso8601String(),
                'meta' => trim(collect([
                    $movement->branch?->name,
                    strtoupper((string) ($movement->direction ?? '')),
                    $movement->amount !== null ? '؋ '.number_format((float) $movement->amount, 0) : null,
                ])->filter()->join(' • ')),
                'href' => '/finance/cash-bank',
                'priority' => in_array($movement->approval_status, ['approved', 'rejected'], true) ? 'high' : 'medium',
                'unread' => ($movement->updated_at ?? $movement->created_at)?->gt(now()->subDay()) ?? false,
            ]);
    }

    private function recentEmployeeNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('employees') || ! $this->hasAnyPermission($user, [
            PermissionEnum::EMPLOYEES_VIEW->value,
            PermissionEnum::EMPLOYEES_CREATE->value,
            PermissionEnum::EMPLOYEES_UPDATE->value,
        ])) {
            return collect();
        }

        return Employee::query()
            ->with(['branch:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->latest()
            ->take(4)
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => "employee-{$employee->id}",
                'category' => 'employees',
                'title' => __('notifications.employees.title'),
                'description' => __('notifications.employees.description', [
                    'name' => trim("{$employee->first_name} {$employee->last_name}"),
                ]),
                'createdAt' => $employee->created_at?->toIso8601String(),
                'meta' => trim(collect([
                    $employee->branch?->name,
                    $employee->status ? ucfirst(strtolower((string) $employee->status)) : null,
                ])->filter()->join(' • ')),
                'priority' => 'medium',
                'unread' => $employee->created_at?->gt(now()->subDay()) ?? false,
            ]);
    }

    private function recentUserNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('users') || ! $this->hasAnyPermission($user, [
            PermissionEnum::USER_VIEW->value,
            PermissionEnum::USER_CREATE->value,
            PermissionEnum::USER_UPDATE->value,
        ])) {
            return collect();
        }

        return User::query()
            ->with(['roles:id,name', 'branch:id,name'])
            ->whereKeyNot($user->getKey())
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->latest()
            ->take(4)
            ->get()
            ->map(fn (User $other) => [
                'id' => "user-{$other->id}",
                'category' => 'users',
                'title' => __('notifications.users.title'),
                'description' => __('notifications.users.description', [
                    'name' => $other->name,
                ]),
                'createdAt' => $other->created_at?->toIso8601String(),
                'meta' => trim(collect([
                    $other->roles->pluck('name')->join(', '),
                    $other->branch?->name,
                ])->filter()->join(' • ')),
                'priority' => 'low',
                'unread' => $other->created_at?->gt(now()->subDay()) ?? false,
            ]);
    }

    private function recentInventoryNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('inventory_items') || ! $this->hasAnyPermission($user, [
            PermissionEnum::INVENTORY_VIEW->value,
            PermissionEnum::INVENTORY_ADJUST->value,
        ])) {
            return collect();
        }

        return InventoryItem::query()
            ->with(['branch:id,name'])
            ->when(
                ! $this->isSuperAdmin($user) && $user->branch_id,
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->latest('updated_at')
            ->take(4)
            ->get()
            ->map(fn (InventoryItem $item) => [
                'id' => "inventory-{$item->id}-{$item->updated_at?->timestamp}",
                'category' => 'inventory',
                'title' => $item->created_at?->equalTo($item->updated_at)
                    ? __('notifications.inventory.added_title')
                    : __('notifications.inventory.updated_title'),
                'description' => $item->created_at?->equalTo($item->updated_at)
                    ? __('notifications.inventory.added_description', ['name' => $item->name])
                    : __('notifications.inventory.updated_description', ['name' => $item->name]),
                'createdAt' => $item->updated_at?->toIso8601String(),
                'meta' => trim(collect([
                    $item->branch?->name,
                    $item->quantity !== null
                        ? __('notifications.inventory.qty_meta', ['quantity' => number_format((float) $item->quantity, 0)])
                        : null,
                ])->filter()->join(' • ')),
                'href' => '/inventory',
                'priority' => ((float) $item->quantity <= 0 ? 'high' : ((float) $item->quantity <= 10 ? 'medium' : 'low')),
                'unread' => $item->updated_at?->gt(now()->subDay()) ?? false,
            ]);
    }

    private function recentProductNotifications(User $user): Collection
    {
        if (! SchemaCache::hasTable('products') || ! $this->hasAnyPermission($user, [
            PermissionEnum::PRODUCTS_VIEW->value,
            PermissionEnum::PRODUCTS_CREATE->value,
            PermissionEnum::PRODUCTS_UPDATE->value,
            PermissionEnum::PRODUCTS_DELETE->value,
        ])) {
            return collect();
        }

        return Product::query()
            ->with(['category:id,name', 'kitchen:id,name'])
            ->latest('updated_at')
            ->take(4)
            ->get()
            ->map(fn (Product $product) => [
                'id' => "product-{$product->id}-{$product->updated_at?->timestamp}",
                'category' => 'products',
                'title' => $product->created_at?->equalTo($product->updated_at)
                    ? __('notifications.products.added_title')
                    : __('notifications.products.updated_title'),
                'description' => $product->created_at?->equalTo($product->updated_at)
                    ? __('notifications.products.added_description', ['name' => $product->name])
                    : __('notifications.products.updated_description', ['name' => $product->name]),
                'createdAt' => $product->updated_at?->toIso8601String(),
                'meta' => trim(collect([
                    $product->category?->name,
                    $product->kitchen?->name,
                ])->filter()->join(' • ')),
                'href' => '/products',
                'priority' => 'low',
                'unread' => $product->updated_at?->gt(now()->subDay()) ?? false,
            ]);
    }

    private function canSeeOrderNotifications(User $user): bool
    {
        return $this->hasAnyPermission($user, [
            PermissionEnum::ORDERS_VIEW->value,
            PermissionEnum::ORDERS_CREATE->value,
            PermissionEnum::ORDERS_UPDATE->value,
            PermissionEnum::PAYMENTS_CREATE->value,
        ]);
    }

    private function shouldSeeBranchOrderNotifications(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->hasRole('cashier')
            || $user->hasRole('kitchen')
            || $this->hasAnyPermission($user, [
                PermissionEnum::PAYMENTS_CREATE->value,
                PermissionEnum::PAYMENTS_VIEW->value,
            ]);
    }

    private function canSeePaymentNotifications(User $user): bool
    {
        return $this->hasAnyPermission($user, [
            PermissionEnum::PAYMENTS_VIEW->value,
            PermissionEnum::PAYMENTS_CREATE->value,
            PermissionEnum::FINANCE_VIEW->value,
            PermissionEnum::FINANCE_MANAGE->value,
        ]);
    }

    private function paymentNotificationHref(User $user): string
    {
        if ($user->hasRole('cashier') || ($user->can(PermissionEnum::PAYMENTS_CREATE->value) && ! $user->can(PermissionEnum::FINANCE_VIEW->value))) {
            return '/orders';
        }

        return '/finance/cash-bank';
    }

    private function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * @param  array<int, string>  $permissions
     */
    private function hasAnyPermission(User $user, array $permissions): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }
}
