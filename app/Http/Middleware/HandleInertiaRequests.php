<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PayrollRun;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->roles->pluck('name')->toArray() ?? [],
                'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
                'is_super_admin' => $request->user()?->hasRole('super-admin') ?? false,
            ],
            'notifications' => fn () => $this->buildNotifications($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
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
        if (! $request->user()) {
            return [];
        }

        return collect()
            ->merge($this->flashNotifications($request))
            ->merge($this->recentOrderNotifications())
            ->merge($this->recentPaymentNotifications())
            ->merge($this->recentPayrollNotifications())
            ->merge($this->recentEmployeeNotifications())
            ->merge($this->recentInventoryNotifications())
            ->merge($this->recentProductNotifications())
            ->merge($this->recentUserNotifications($request->user()))
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
    private function recentOrderNotifications(): Collection
    {
        if (! Schema::hasTable('orders')) {
            return collect();
        }

        return Order::query()
            ->with(['branch:id,name', 'branchTable:id,table_number', 'user:id,name'])
            ->latest()
            ->take(6)
            ->get()
            ->map(fn (Order $order) => [
                'id' => "order-{$order->id}",
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
                'createdAt' => $order->created_at?->toIso8601String(),
                'meta' => trim(collect([
                    $order->branch?->name,
                    $order->total_amount !== null
                        ? __('notifications.orders.total_meta', [
                            'amount' => number_format((float) $order->total_amount, 0),
                        ])
                        : null,
                ])->filter()->join(' • ')),
                'priority' => 'high',
                'unread' => $order->created_at?->gt(now()->subHours(12)) ?? false,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentPaymentNotifications(): Collection
    {
        if (! Schema::hasTable('payments')) {
            return collect();
        }

        return Payment::query()
            ->with(['order:id,total_amount', 'receiver:id,name'])
            ->latest()
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
                    $payment->currency ? strtoupper((string) $payment->currency) : null,
                    $payment->amount !== null ? number_format((float) $payment->amount, 0) : null,
                ])->filter()->join(' • ')),
                'priority' => 'medium',
                'unread' => ($payment->payment_date ?? $payment->created_at)?->gt(now()->subHours(12)) ?? false,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentPayrollNotifications(): Collection
    {
        if (! Schema::hasTable('payroll_runs')) {
            return collect();
        }

        return PayrollRun::query()
            ->with(['branch:id,name'])
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
                        ? $payrollRun->period_start->format('M d').' - '.$payrollRun->period_end->format('M d')
                        : null,
                ])->filter()->join(' • ')),
                'priority' => 'high',
                'unread' => ($payrollRun->paid_at ?? $payrollRun->approved_at ?? $payrollRun->created_at)?->gt(now()->subDay()) ?? false,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentEmployeeNotifications(): Collection
    {
        if (! Schema::hasTable('employees')) {
            return collect();
        }

        return Employee::query()
            ->with(['branch:id,name'])
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
        if (! Schema::hasTable('users')) {
            return collect();
        }

        return User::query()
            ->with(['roles:id,name', 'branch:id,name'])
            ->whereKeyNot($currentUser->getKey())
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
    private function recentInventoryNotifications(): Collection
    {
        if (! Schema::hasTable('inventory_items')) {
            return collect();
        }

        return InventoryItem::query()
            ->with(['branch:id,name'])
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
    private function recentProductNotifications(): Collection
    {
        if (! Schema::hasTable('products')) {
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
}
