<?php

namespace App\Services\Order;

use App\Enums\PaymentMethod;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Branch;
use App\Models\BranchTable;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private readonly OrderItemService $orderItemService) {}

    public function getIndexData(?string $selectedDate, bool $isAllTime): array
    {
        $ordersQuery = Order::with([
            'branch',
            'branchTable',
            'user',
            'payments',
            'items.product',
            'items.productSize',
            'items.kitchen',
        ])->withCount('items')->orderByDesc('id');

        if (! $isAllTime && $selectedDate) {
            $ordersQuery->whereDate('created_at', $selectedDate);
        }

        $restaurantStartDate = Order::query()
            ->orderBy('created_at')
            ->value('created_at');

        return [
            'orders' => $ordersQuery->get(),
            'branches' => Branch::orderBy('name')->get(),
            'products' => Product::with(['sizes', 'kitchen'])
                ->orderBy('name')
                ->get(),
            'branchTables' => BranchTable::where('is_active', true)
                ->orderBy('branch_id')
                ->orderBy('table_number')
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

    public function createOrder(array $data, ?int $userId): void
    {
        $this->validateOrderConstraints($data);

        DB::transaction(function () use ($data, $userId) {
            $total = $this->orderItemService->calculateTotal($data['items']);

            $order = Order::create([
                'branch_id' => $data['branch_id'],
                'branch_table_id' => $data['branch_table_id'] ?? null,
                'user_id' => $userId,
                'order_type' => $data['order_type'],
                'customer_name' => $data['order_type'] === OrderType::DELIVERY->value
                    ? trim((string) ($data['customer_name'] ?? ''))
                    : null,
                'customer_phone' => $data['order_type'] === OrderType::DELIVERY->value
                    ? trim((string) ($data['customer_phone'] ?? ''))
                    : null,
                'delivery_address' => $data['order_type'] === OrderType::DELIVERY->value
                    ? trim((string) ($data['delivery_address'] ?? ''))
                    : null,
                'sub_total_amount' => $total,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'service_charge_amount' => 0,
                'base_currency' => 'AFN',
                'exchange_rate' => null,
                'total_amount' => $total,
                'paid_amount' => $total,
                'change_amount' => 0,
                'refund_amount' => 0,
                'status' => OrderStatus::PENDING->value,
            ]);

            $this->orderItemService->createManyForOrder($order, $data['items']);

            $this->syncOrderPayment(
                order: $order,
                paymentMethod: $data['payment_method'],
            );
        });
    }

    public function updateStatus(
        Order $order,
        string $status,
        ?string $paymentMethod = null,
    ): void
    {
        DB::transaction(function () use ($order, $status, $paymentMethod) {
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
                );
            }
        });
    }

    public function updateTable(Order $order, int $branchTableId): void
    {
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

    public function addItems(Order $order, array $items): void
    {
        DB::transaction(function () use ($order, $items) {
            $payload = $this->orderItemService->createManyForOrder($order, $items);
            $delta = $this->orderItemService->calculateTotalFromPayload($payload);

            $order->update([
                'total_amount' => (int) $order->total_amount + $delta,
            ]);
        });
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
            if (empty(trim((string) ($data['customer_name'] ?? '')))) {
                throw ValidationException::withMessages([
                    'customer_name' => 'Customer name is required for delivery orders.',
                ]);
            }

            if (empty(trim((string) ($data['customer_phone'] ?? '')))) {
                throw ValidationException::withMessages([
                    'customer_phone' => 'Customer phone is required for delivery orders.',
                ]);
            }

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

    private function syncOrderPayment(Order $order, string $paymentMethod): void
    {
        $payment = $order->payments()->orderBy('id')->first();

        $payload = [
            'currency' => $order->base_currency ?? 'AFN',
            'amount' => $order->paid_amount,
            'exchange_rate' => $order->exchange_rate,
            'method' => $paymentMethod,
            'payment_date' => now(),
            'status' => 'paid',
            'received_by' => $order->user_id,
        ];

        if ($payment) {
            $payment->update($payload);

            return;
        }

        $order->payments()->create($payload);
    }
}
