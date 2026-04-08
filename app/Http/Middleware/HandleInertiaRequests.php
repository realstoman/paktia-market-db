<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PayrollRun;
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
            ->merge($this->recentOrderNotifications())
            ->merge($this->recentPaymentNotifications())
            ->merge($this->recentPayrollNotifications())
            ->merge($this->recentEmployeeNotifications())
            ->merge($this->recentUserNotifications($request->user()))
            ->sortByDesc('createdAt')
            ->take(12)
            ->values()
            ->all();
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
                'title' => 'New order received',
                'description' => sprintf(
                    'Order #%d was created%s%s.',
                    $order->id,
                    $order->branchTable?->table_number ? " for table {$order->branchTable->table_number}" : '',
                    $order->user?->name ? " by {$order->user->name}" : '',
                ),
                'createdAt' => $order->created_at?->toIso8601String(),
                'meta' => trim(collect([
                    $order->branch?->name,
                    $order->total_amount !== null ? 'Total '.number_format((float) $order->total_amount, 0) : null,
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
                'title' => 'Payment recorded',
                'description' => sprintf(
                    '%s payment%s%s was posted successfully.',
                    strtoupper((string) $payment->method ?: 'Payment'),
                    $payment->order_id ? " for order #{$payment->order_id}" : '',
                    $payment->receiver?->name ? " by {$payment->receiver->name}" : '',
                ),
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
                'title' => 'Payroll activity updated',
                'description' => sprintf(
                    'Payroll run #%d for %d employees is currently %s.',
                    $payrollRun->id,
                    $payrollRun->items_count,
                    str_replace('_', ' ', strtolower((string) $payrollRun->status)),
                ),
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
                'title' => 'New employee added',
                'description' => trim("{$employee->first_name} {$employee->last_name} joined the team."),
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
                'title' => 'New user account created',
                'description' => "{$user->name} was added to the platform.",
                'createdAt' => $user->created_at?->toIso8601String(),
                'meta' => trim(collect([
                    $user->roles->pluck('name')->join(', '),
                    $user->branch?->name,
                ])->filter()->join(' • ')),
                'priority' => 'low',
                'unread' => $user->created_at?->gt(now()->subDay()) ?? false,
            ]);
    }
}
