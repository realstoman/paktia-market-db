<?php

namespace App\Http\Middleware;

use App\Enums\PermissionEnum;
use App\Models\CashMovement;
use App\Models\Employee;
use App\Models\EmployeeAdvance;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PayrollRun;
use App\Models\PayrollRunItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Settings\SystemBrandingService;
use App\Support\AfghanCalendar;
use Illuminate\Support\Collection;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $supportedLocales = config('localization.supported', []);
        $currentLocale = app()->getLocale();
        $branding = app(SystemBrandingService::class)->getBranding();

        return [
            ...parent::share($request),
            'name' => $branding['name'],
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->roles->pluck('name')->toArray() ?? [],
                'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
                'is_super_admin' => $request->user()?->hasRole('super-admin') ?? false,
            ],
            'notifications' => fn () => $this->buildNotifications($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'branding' => $branding,
            'localization' => [
                'locale' => $currentLocale,
                'direction' => data_get($supportedLocales, "{$currentLocale}.direction", 'ltr'),
                'isRtl' => data_get($supportedLocales, "{$currentLocale}.direction", 'ltr') === 'rtl',
                'languages' => collect($supportedLocales)
                    ->map(fn (array $language, string $code) => [
                        'code' => $code,
                        'label' => $language['label'] ?? strtoupper($code),
                        'nativeLabel' => $language['native_label'] ?? ($language['label'] ?? strtoupper($code)),
                        'direction' => $language['direction'] ?? 'ltr',
                        'isDefault' => (bool) ($language['is_default'] ?? false),
                    ])
                    ->values()
                    ->all(),
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildNotifications(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        return collect()
            ->merge($this->flashNotifications($request))
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
            ->take(12)
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function flashNotifications(Request $request): Collection
    {
        $flash = $request->session()->get('notification');

        if (! is_array($flash) || empty($flash['id'])) {
            return collect();
        }

        return collect([[
            'id' => (string) $flash['id'],
            'category' => $flash['category'] ?? 'system',
            'title' => $flash['title'] ?? __('notifications.flash.title'),
            'description' => $flash['description'] ?? '',
            'createdAt' => now()->toIso8601String(),
            'meta' => $flash['meta'] ?? null,
            'href' => $flash['href'] ?? null,
            'priority' => $flash['priority'] ?? 'medium',
            'unread' => true,
        ]]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentOrderNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('orders') || ! $this->canSeeOrderNotifications($currentUser)) {
            return collect();
        }

        $showBranchOrders = $this->shouldSeeBranchOrderNotifications($currentUser);

        return Order::query()
            ->with(['branch:id,name', 'branchTable:id,table_number', 'user:id,name'])
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
            )
            ->when(
                ! $this->isSuperAdmin($currentUser) && ! $showBranchOrders,
                fn ($query) => $query->where('user_id', $currentUser->id),
            )
            ->latest('updated_at')
            ->take(6)
            ->get()
            ->map(function (Order $order) {
                $status = (string) ($order->status?->value ?? $order->status ?? 'pending');
                $statusLabel = Str::of($status)->replace('_', ' ')->title()->value();
                $wasUpdated = $order->updated_at && $order->created_at
                    ? $order->updated_at->gt($order->created_at->addSeconds(5))
                    : false;

                return [
                    'id' => "order-{$order->id}-".($order->updated_at?->timestamp ?? $order->created_at?->timestamp ?? $order->id),
                    'category' => 'orders',
                    'title' => $wasUpdated
                        ? "Order #{$order->id} moved to {$statusLabel}"
                        : __('notifications.orders.title'),
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

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentPaymentNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('payments') || ! $this->canSeePaymentNotifications($currentUser)) {
            return collect();
        }

        $href = $this->paymentNotificationHref($currentUser);

        return Payment::query()
            ->with(['order:id,total_amount,branch_id,user_id', 'order.branch:id,name', 'receiver:id,name'])
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->whereHas('order', fn ($orderQuery) => $orderQuery->where('branch_id', $currentUser->branch_id)),
            )
            ->latest('payment_date')
            ->take(4)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => "payment-{$payment->id}",
                'category' => 'payments',
                'title' => __('notifications.payments.title'),
                'description' => __('notifications.payments.description', [
                    'method' => $payment->status === 'covered_by_employee'
                        ? __('notifications.payments.method_fallback').' · Employee Cover'
                        : strtoupper((string) $payment->method ?: __('notifications.payments.method_fallback')),
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
                    $payment->amount !== null ? $this->formatAfnMeta((float) $payment->amount) : null,
                ])->filter()->join(' • ')),
                'href' => $href,
                'priority' => 'medium',
                'unread' => ($payment->payment_date ?? $payment->created_at)?->gt(now()->subHours(12)) ?? false,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentPayrollNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('payroll_runs') || ! $this->hasAnyPermission($currentUser, [
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
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
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

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentPayrollPaymentNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('payroll_run_items') || ! $this->hasAnyPermission($currentUser, [
            PermissionEnum::PAYROLL_VIEW->value,
            PermissionEnum::PAYROLL_PAY->value,
        ])) {
            return collect();
        }

        return PayrollRunItem::query()
            ->with(['employee:id,first_name,last_name,branch_id', 'employee.branch:id,name', 'payrollRun:id,branch_id'])
            ->where('payment_status', 'paid')
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->whereHas('payrollRun', fn ($runQuery) => $runQuery->where('branch_id', $currentUser->branch_id)),
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
                        collect($item->covered_period_dates ?? [])
                            ->filter()
                            ->map(fn ($date) => AfghanCalendar::formatMonthLabel($date))
                            ->join(', '),
                        $item->net_salary !== null ? $this->formatAfnMeta((float) $item->net_salary) : null,
                    ])->filter()->join(' • ')),
                    'href' => '/finance/payroll',
                    'priority' => 'high',
                    'unread' => ($item->payment_date ?? $item->updated_at ?? $item->created_at)?->gt(now()->subDay()) ?? false,
                ];
            });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentAdvanceNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('employee_advances') || ! $this->hasAnyPermission($currentUser, [
            PermissionEnum::FINANCE_VIEW->value,
            PermissionEnum::FINANCE_MANAGE->value,
            PermissionEnum::PAYROLL_VIEW->value,
            PermissionEnum::PAYROLL_APPROVE->value,
        ])) {
            return collect();
        }

        return EmployeeAdvance::query()
            ->with(['employee:id,first_name,last_name', 'branch:id,name', 'creator:id,name', 'approver:id,name'])
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
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
                        $advance->amount !== null ? $this->formatAfnMeta((float) $advance->amount) : null,
                    ])->filter()->join(' • ')),
                    'href' => '/finance/employee-advances',
                    'priority' => in_array($advance->status, ['approved', 'rejected'], true) ? 'high' : 'medium',
                    'unread' => ($advance->updated_at ?? $advance->created_at)?->gt(now()->subDay()) ?? false,
                ];
            });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentExpenseNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('expenses') || ! $this->hasAnyPermission($currentUser, [
            PermissionEnum::FINANCE_VIEW->value,
            PermissionEnum::FINANCE_MANAGE->value,
            PermissionEnum::EXPENSES_VIEW->value,
            PermissionEnum::EXPENSES_CREATE->value,
        ])) {
            return collect();
        }

        return Expense::query()
            ->with(['branch:id,name', 'vendor:id,name', 'creator:id,name', 'approver:id,name'])
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
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
                        $expense->amount !== null ? $this->formatAfnMeta((float) $expense->amount) : null,
                    ])->filter()->join(' • ')),
                    'href' => '/finance/expenses',
                    'priority' => in_array($status, ['approved', 'cancelled'], true) ? 'high' : 'medium',
                    'unread' => ($expense->updated_at ?? $expense->created_at)?->gt(now()->subDay()) ?? false,
                ];
            });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentCashMovementNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('cash_movements') || ! $this->hasAnyPermission($currentUser, [
            PermissionEnum::FINANCE_VIEW->value,
            PermissionEnum::FINANCE_MANAGE->value,
            PermissionEnum::PAYMENTS_VIEW->value,
            PermissionEnum::PAYMENTS_CREATE->value,
        ])) {
            return collect();
        }

        return CashMovement::query()
            ->with(['branch:id,name', 'creator:id,name', 'approver:id,name'])
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
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
                    $movement->amount !== null ? $this->formatAfnMeta((float) $movement->amount) : null,
                ])->filter()->join(' • ')),
                'href' => '/finance/cash-bank',
                'priority' => in_array($movement->approval_status, ['approved', 'rejected'], true) ? 'high' : 'medium',
                'unread' => ($movement->updated_at ?? $movement->created_at)?->gt(now()->subDay()) ?? false,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentEmployeeNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('employees') || ! $this->hasAnyPermission($currentUser, [
            PermissionEnum::EMPLOYEES_VIEW->value,
            PermissionEnum::EMPLOYEES_CREATE->value,
            PermissionEnum::EMPLOYEES_UPDATE->value,
        ])) {
            return collect();
        }

        return Employee::query()
            ->with(['branch:id,name'])
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
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

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentUserNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('users') || ! $this->hasAnyPermission($currentUser, [
            PermissionEnum::USER_VIEW->value,
            PermissionEnum::USER_CREATE->value,
            PermissionEnum::USER_UPDATE->value,
        ])) {
            return collect();
        }

        return User::query()
            ->with(['roles:id,name', 'branch:id,name'])
            ->whereKeyNot($currentUser->getKey())
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
            )
            ->latest()
            ->take(4)
            ->get()
            ->map(fn (User $user) => [
                'id' => "user-{$user->id}",
                'category' => 'users',
                'title' => __('notifications.users.title'),
                'description' => __('notifications.users.description', [
                    'name' => $user->name,
                ]),
                'createdAt' => $user->created_at?->toIso8601String(),
                'meta' => trim(collect([
                    $user->roles->pluck('name')->join(', '),
                    $user->branch?->name,
                ])->filter()->join(' • ')),
                'priority' => 'low',
                'unread' => $user->created_at?->gt(now()->subDay()) ?? false,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentInventoryNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('inventory_items') || ! $this->hasAnyPermission($currentUser, [
            PermissionEnum::INVENTORY_VIEW->value,
            PermissionEnum::INVENTORY_ADJUST->value,
        ])) {
            return collect();
        }

        return InventoryItem::query()
            ->with(['branch:id,name'])
            ->when(
                ! $this->isSuperAdmin($currentUser) && $currentUser->branch_id,
                fn ($query) => $query->where('branch_id', $currentUser->branch_id),
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
                    ? __('notifications.inventory.added_description', [
                        'name' => $item->name,
                    ])
                    : __('notifications.inventory.updated_description', [
                        'name' => $item->name,
                    ]),
                'createdAt' => $item->updated_at?->toIso8601String(),
                'meta' => trim(collect([
                    $item->branch?->name,
                    $item->quantity !== null
                        ? __('notifications.inventory.qty_meta', [
                            'quantity' => number_format((float) $item->quantity, 0),
                        ])
                        : null,
                ])->filter()->join(' • ')),
                'href' => '/inventory',
                'priority' => ((float) $item->quantity <= 0 ? 'high' : ((float) $item->quantity <= 10 ? 'medium' : 'low')),
                'unread' => $item->updated_at?->gt(now()->subDay()) ?? false,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentProductNotifications(User $currentUser): Collection
    {
        if (! Schema::hasTable('products') || ! $this->hasAnyPermission($currentUser, [
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
                    ? __('notifications.products.added_description', [
                        'name' => $product->name,
                    ])
                    : __('notifications.products.updated_description', [
                        'name' => $product->name,
                    ]),
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

    private function formatAfnMeta(float $amount): string
    {
        return '؋ '.number_format($amount, 0);
    }
}
