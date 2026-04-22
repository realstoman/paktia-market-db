<?php

namespace App\Services\Order;

use App\Enums\PermissionEnum;
use App\Enums\PaymentMethod;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Branch;
use App\Models\BranchTable;
use App\Models\Customer;
use App\Models\DiscountCard;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Projection\ProjectionDispatchService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly OrderItemService $orderItemService,
        private readonly ProjectionDispatchService $projectionDispatchService,
    ) {}

    public function getIndexData(?string $selectedDate, bool $isAllTime, ?User $user = null): array
    {
        $isSuperAdmin = $user?->hasRole('super-admin') ?? false;
        $isOrderTaker = $user?->hasRole('order-taker') ?? false;
        $isKitchen = $user?->hasRole('kitchen') ?? false;
        $allowedBranchId = ! $isSuperAdmin ? $user?->branch_id : null;
        $allowedKitchenId = $isKitchen ? $user?->kitchen_id : null;

        $ordersQuery = Order::with([
            'branch',
            'branchTable',
            'user',
            'client',
            'customer',
            'discountCard',
            'payments',
            'items' => fn ($query) => $query
                ->when($allowedKitchenId, fn ($itemQuery) => $itemQuery->where('kitchen_id', $allowedKitchenId))
                ->with(['product', 'productSize', 'kitchen']),
        ])->withCount('items')->orderByDesc('id');

        if (! $isAllTime && $selectedDate) {
            $ordersQuery->whereDate('created_at', $selectedDate);
        }

        if ($isKitchen && ! $allowedKitchenId) {
            $ordersQuery->whereRaw('1 = 0');
        } elseif ($isOrderTaker && $user?->id) {
            $ordersQuery->where('user_id', $user->id);
        } elseif ($allowedKitchenId) {
            $ordersQuery->whereHas('items', fn ($query) => $query->where('kitchen_id', $allowedKitchenId));
        } elseif ($allowedBranchId) {
            $ordersQuery->where('branch_id', $allowedBranchId);
        }

        $restaurantStartDate = Order::query()
            ->orderBy('created_at')
            ->value('created_at');

        return [
            'orders' => $ordersQuery->get(),
            'branches' => Branch::query()
                ->when($allowedBranchId, fn ($query) => $query->where('id', $allowedBranchId))
                ->orderBy('name')
                ->get(),
            'products' => Product::with(['sizes', 'kitchen'])
                ->orderBy('name')
                ->get(),
            'branchTables' => BranchTable::query()
                ->where('is_active', true)
                ->when($allowedBranchId, fn ($query) => $query->where('branch_id', $allowedBranchId))
                ->orderBy('branch_id')
                ->orderBy('table_number')
                ->get(),
            'customers' => Customer::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->orderBy('phone')
                ->get(['id', 'name', 'phone', 'email']),
            'discountCards' => DiscountCard::query()
                ->active()
                ->orderBy('name')
                ->get(),
            'selectedDate' => $selectedDate,
            'isAllTime' => $isAllTime,
            'restaurantStartDate' => $restaurantStartDate,
        ];
    }

    public function resolveSelectedDate(bool $isAllTime, ?string $date): ?string
    {
        if ($isAllTime) {
            return null;
        }

        return $date ?? Carbon::today()->toDateString();
    }

    public function createOrder(array $data, ?int $userId, ?User $user = null): void
    {
        $data['branch_id'] = $this->resolveAllowedBranchId($data['branch_id'], $user);
        $this->validateOrderConstraints($data);

        DB::transaction(function () use ($data, $userId) {
            $total = $this->orderItemService->calculateTotal($data['items']);
            $customerPayload = $this->resolveCustomerPayload($data);

            $order = Order::create([
                'branch_id' => $data['branch_id'],
                'branch_table_id' => $data['branch_table_id'] ?? null,
                'user_id' => $userId,
                'customer_id' => $customerPayload['customer_id'],
                'order_type' => $data['order_type'],
                'customer_name' => $customerPayload['customer_name'],
                'customer_phone' => $customerPayload['customer_phone'],
                'delivery_address' => $data['order_type'] === OrderType::DELIVERY->value
                    ? trim((string) ($data['delivery_address'] ?? ''))
                    : null,
                'discount_card_id' => $data['discount_card_id'] ?? null,
                'discount_type' => null,
                'discount_value' => null,
                'discount_label' => null,
                'sub_total_amount' => $total,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'service_charge_amount' => 0,
                'base_currency' => 'AFN',
                'exchange_rate' => null,
                'total_amount' => $total,
                'paid_amount' => 0,
                'change_amount' => 0,
                'refund_amount' => 0,
                'status' => OrderStatus::PENDING->value,
            ]);

            $this->orderItemService->createManyForOrder($order, $data['items']);
            $this->syncOrderAmounts($order, $total);
            $this->projectionDispatchService->queueBranchDailyMetric(
                $order->branch_id,
                $order->created_at,
            );
        });
    }

    public function updateOrder(Order $order, array $data, ?User $user = null): void
    {
        $this->assertActorCanManageOrder($order, $user);
        $data['branch_id'] = $this->resolveAllowedBranchId($data['branch_id'], $user);
        $this->assertOrderCanBeModified($order);
        $this->validateOrderConstraints($data);
        $originalBranchId = $order->branch_id;
        $originalCreatedAt = $order->created_at;

        DB::transaction(function () use ($order, $data) {
            $customerPayload = $this->resolveCustomerPayload($data);

            $order->update([
                'branch_id' => $data['branch_id'],
                'branch_table_id' => $data['order_type'] === OrderType::DINE_IN->value
                    ? ($data['branch_table_id'] ?? null)
                    : null,
                'customer_id' => $customerPayload['customer_id'],
                'order_type' => $data['order_type'],
                'customer_name' => $customerPayload['customer_name'],
                'customer_phone' => $customerPayload['customer_phone'],
                'delivery_address' => $data['order_type'] === OrderType::DELIVERY->value
                    ? trim((string) ($data['delivery_address'] ?? ''))
                    : null,
                'discount_card_id' => $data['discount_card_id'] ?? null,
            ]);

            $this->orderItemService->replaceForOrder($order, $data['items']);
            $total = (float) $order->items()->sum('line_total');
            $this->syncOrderAmounts($order, $total);
        });

        $this->projectionDispatchService->queueBranchDailyMetric(
            $originalBranchId,
            $originalCreatedAt,
        );
        $this->projectionDispatchService->queueBranchDailyMetric(
            $order->branch_id,
            $order->created_at,
        );
    }

    private function resolveAllowedBranchId(int|string|null $branchId, ?User $user): int
    {
        $requestedBranchId = (int) $branchId;

        if (! $user || $user->hasRole('super-admin')) {
            return $requestedBranchId;
        }

        if (! $user->branch_id) {
            throw ValidationException::withMessages([
                'branch_id' => 'This user is not assigned to a branch.',
            ]);
        }

        if ($requestedBranchId !== (int) $user->branch_id) {
            throw ValidationException::withMessages([
                'branch_id' => 'You can only create orders for your assigned branch.',
            ]);
        }

        return (int) $user->branch_id;
    }

    public function updateStatus(
        Order $order,
        string $status,
        ?string $paymentMethod = null,
        ?float $discountAmount = null,
        ?int $discountCardId = null,
        ?User $actor = null,
    ): void
    {
        $this->assertStatusCanBeUpdated($order, $status, $actor, $paymentMethod);

        DB::transaction(function () use ($order, $status, $paymentMethod, $discountAmount, $discountCardId, $actor) {
            if ($status === OrderStatus::COMPLETED->value) {
                $subTotal = (float) ($order->sub_total_amount ?? 0);
                $discountDetails = $this->resolveDiscountDetails(
                    order: $order,
                    subTotal: $subTotal,
                    manualDiscountAmount: $discountAmount,
                    discountCardId: $discountCardId,
                );

                $order->update($discountDetails);

                $this->syncOrderAmounts($order, $subTotal);
            }

            $order->update([
                'status' => $status,
                'completed_at' => $status === OrderStatus::COMPLETED->value
                    ? now()
                    : null,
                'cancelled_at' => $status === OrderStatus::CANCELLED->value
                    ? now()
                    : null,
            ]);

            if ($status === OrderStatus::COMPLETED->value) {
                $this->syncOrderPayment(
                    order: $order->fresh(),
                    paymentMethod: $paymentMethod ?? PaymentMethod::CASH->value,
                    receivedBy: $actor?->id ?? $order->user_id,
                );
            }
        });

        $this->projectionDispatchService->queueBranchDailyMetric(
            $order->branch_id,
            $order->created_at,
        );
    }

    public function updateTable(Order $order, int $branchTableId, ?User $user = null): void
    {
        $this->assertActorCanManageOrder($order, $user);
        $this->assertOrderCanBeModified($order);

        $this->assertTableBelongsToBranch(
            branchTableId: $branchTableId,
            branchId: $order->branch_id,
            errorKey: 'branch_table_id',
            errorMessage: 'Selected table does not belong to the order branch.',
        );

        $order->update([
            'branch_table_id' => $branchTableId,
        ]);
    }

    public function addItems(Order $order, array $items, ?User $user = null): void
    {
        $this->assertActorCanManageOrder($order, $user);
        $this->assertOrderCanBeModified($order);

        DB::transaction(function () use ($order, $items) {
            $payload = $this->orderItemService->createManyForOrder($order, $items);
            $delta = $this->orderItemService->calculateTotalFromPayload($payload);
            $subTotal = (float) ($order->sub_total_amount ?? $order->total_amount) + $delta;

            $this->syncOrderAmounts($order, $subTotal);

            $paymentMethod = $order->payments()->orderBy('id')->value('method');
            if ($paymentMethod) {
                $this->syncOrderPayment(
                    order: $order->fresh(),
                    paymentMethod: $paymentMethod,
                );
            }
        });

        $this->projectionDispatchService->queueBranchDailyMetric(
            $order->branch_id,
            $order->created_at,
        );
    }

    private function validateOrderConstraints(array $data): void
    {
        if (($data['order_type'] ?? null) === OrderType::DINE_IN->value) {
            if (! isset($data['branch_table_id'])) {
                throw ValidationException::withMessages([
                    'branch_table_id' => 'Table number is required for dine in orders.',
                ]);
            }

            $this->assertTableBelongsToBranch(
                branchTableId: (int) $data['branch_table_id'],
                branchId: (int) $data['branch_id'],
                errorKey: 'branch_table_id',
                errorMessage: 'Selected table does not belong to the selected branch.',
            );
        }

        if (($data['order_type'] ?? null) === OrderType::DELIVERY->value) {
            if (empty(trim((string) ($data['delivery_address'] ?? '')))) {
                throw ValidationException::withMessages([
                    'delivery_address' => 'Delivery address is required for delivery orders.',
                ]);
            }
        }
    }

    private function assertTableBelongsToBranch(
        int $branchTableId,
        int $branchId,
        string $errorKey,
        string $errorMessage,
    ): void {
        $belongsToBranch = BranchTable::query()
            ->whereKey($branchTableId)
            ->where('branch_id', $branchId)
            ->exists();

        if (! $belongsToBranch) {
            throw ValidationException::withMessages([
                $errorKey => $errorMessage,
            ]);
        }
    }

    private function assertOrderCanBeModified(Order $order): void
    {
        if (($order->status?->value ?? $order->status) === OrderStatus::COMPLETED->value) {
            throw ValidationException::withMessages([
                'order' => 'Completed orders can no longer be edited.',
            ]);
        }
    }

    private function assertStatusCanBeUpdated(Order $order, string $nextStatus, ?User $actor, ?string $paymentMethod = null): void
    {
        $this->assertActorCanManageOrder($order, $actor);
        $currentStatus = (string) ($order->status?->value ?? $order->status);

        if ($currentStatus === OrderStatus::COMPLETED->value
            && ! ($actor?->hasRole('super-admin') ?? false)
        ) {
            throw ValidationException::withMessages([
                'status' => 'Only super admins can change the status of a completed order.',
            ]);
        }

        if ($nextStatus === OrderStatus::COMPLETED->value) {
            $canSettlePayment = ($actor?->hasRole('super-admin') ?? false)
                || ($actor?->can(PermissionEnum::PAYMENTS_CREATE->value) ?? false);

            if (! $canSettlePayment) {
                throw ValidationException::withMessages([
                    'status' => 'Only cashiers or super admins can complete an order after payment.',
                ]);
            }

            if (! $paymentMethod) {
                throw ValidationException::withMessages([
                    'payment_method' => 'Payment method is required before completing an order.',
                ]);
            }
        }
    }

    private function assertActorCanManageOrder(Order $order, ?User $actor): void
    {
        if (! $actor) {
            return;
        }

        $canManageAllOrders = $actor->hasRole('super-admin')
            || $actor->can(PermissionEnum::PAYMENTS_CREATE->value);

        if ($canManageAllOrders) {
            return;
        }

        if ((int) ($order->user_id ?? 0) !== (int) $actor->id) {
            throw ValidationException::withMessages([
                'order' => 'You can only manage orders you created.',
            ]);
        }
    }

    private function syncOrderPayment(Order $order, string $paymentMethod, ?int $receivedBy = null): void
    {
        $order->update([
            'paid_amount' => $order->total_amount,
            'change_amount' => 0,
        ]);

        $payment = $order->payments()->orderBy('id')->first();

        $payload = [
            'currency' => $order->base_currency ?? 'AFN',
            'amount' => $order->total_amount,
            'exchange_rate' => $order->exchange_rate,
            'method' => $paymentMethod,
            'payment_date' => now(),
            'status' => 'paid',
            'received_by' => $receivedBy,
        ];

        if ($payment) {
            $payment->update($payload);

            return;
        }

        $order->payments()->create($payload);
    }

    private function syncOrderAmounts(Order $order, float|int $subTotal): void
    {
        $discount = (float) ($order->discount_amount ?? 0);
        $tax = (float) ($order->tax_amount ?? 0);
        $serviceCharge = (float) ($order->service_charge_amount ?? 0);
        $total = max(0, $subTotal - $discount + $tax + $serviceCharge);
        $paidAmount = min($total, (float) $order->payments()->sum('amount'));

        $order->update([
            'sub_total_amount' => $subTotal,
            'total_amount' => $total,
            'paid_amount' => $paidAmount,
            'change_amount' => 0,
            'refund_amount' => 0,
        ]);
    }

    private function resolveCustomerPayload(array $data): array
    {
        $customerName = trim((string) ($data['customer_name'] ?? ''));
        $customerPhone = trim((string) ($data['customer_phone'] ?? ''));
        $customerId = isset($data['customer_id']) && $data['customer_id']
            ? (int) $data['customer_id']
            : null;

        if ($customerId) {
            $customer = Customer::query()->find($customerId);

            if ($customer) {
                $updated = false;

                if ($customerName !== '' && $customer->name !== $customerName) {
                    $customer->name = $customerName;
                    $updated = true;
                }

                if ($customerPhone !== '' && $customer->phone !== $customerPhone) {
                    $customer->phone = $customerPhone;
                    $updated = true;
                }

                if ($updated) {
                    $customer->save();
                }

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customerName !== '' ? $customerName : $customer->name,
                    'customer_phone' => $customerPhone !== '' ? $customerPhone : $customer->phone,
                ];
            }
        }

        if ($customerName === '' && $customerPhone === '') {
            return [
                'customer_id' => null,
                'customer_name' => null,
                'customer_phone' => null,
            ];
        }

        $customer = null;

        if ($customerPhone !== '') {
            $customer = Customer::query()->where('phone', $customerPhone)->first();
        }

        if ($customer) {
            $customer->update([
                'name' => $customerName !== '' ? $customerName : $customer->name,
                'phone' => $customerPhone !== '' ? $customerPhone : $customer->phone,
                'is_active' => true,
            ]);
        } else {
            $customer = Customer::query()->create([
                'name' => $customerName !== '' ? $customerName : null,
                'phone' => $customerPhone !== '' ? $customerPhone : null,
                'is_active' => true,
            ]);
        }

        return [
            'customer_id' => $customer->id,
            'customer_name' => $customerName !== '' ? $customerName : $customer->name,
            'customer_phone' => $customerPhone !== '' ? $customerPhone : $customer->phone,
        ];
    }

    private function resolveDiscountDetails(
        Order $order,
        float $subTotal,
        ?float $manualDiscountAmount = null,
        ?int $discountCardId = null,
    ): array {
        $resolvedDiscountCardId = $discountCardId ?: $order->discount_card_id;

        if ($resolvedDiscountCardId) {
            $discountCard = DiscountCard::query()
                ->active()
                ->find($resolvedDiscountCardId);

            if ($discountCard) {
                $resolvedDiscount = $discountCard->discount_type === 'percentage'
                    ? ($subTotal * ((float) $discountCard->discount_value / 100))
                    : (float) $discountCard->discount_value;

                if ($discountCard->max_discount_amount !== null) {
                    $resolvedDiscount = min(
                        $resolvedDiscount,
                        (float) $discountCard->max_discount_amount,
                    );
                }

                return [
                    'discount_card_id' => $discountCard->id,
                    'discount_type' => $discountCard->discount_type,
                    'discount_value' => $discountCard->discount_value,
                    'discount_label' => $discountCard->name,
                    'discount_amount' => min(max($resolvedDiscount, 0), $subTotal),
                ];
            }
        }

        $resolvedDiscount = $manualDiscountAmount !== null
            ? min(max($manualDiscountAmount, 0), $subTotal)
            : (float) ($order->discount_amount ?? 0);

        return [
            'discount_card_id' => null,
            'discount_type' => $resolvedDiscount > 0 ? 'manual' : null,
            'discount_value' => $resolvedDiscount > 0 ? $resolvedDiscount : null,
            'discount_label' => $resolvedDiscount > 0 ? 'Manual discount' : null,
            'discount_amount' => $resolvedDiscount,
        ];
    }
}
