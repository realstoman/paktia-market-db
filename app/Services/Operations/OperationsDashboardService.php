<?php

namespace App\Services\Operations;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\BranchTable;
use App\Models\Customer;
use App\Models\DiscountCard;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;

class OperationsDashboardService
{
    public function build(User $user): array
    {
        $branchId = $user->branch_id;
        $roleMode = $this->resolveRoleMode($user);

        $products = Product::query()
            ->select([
                'id',
                'name',
                'description',
                'product_category_id',
                'kitchen_id',
                'base_price',
                'is_active',
            ])
            ->with([
                'category:id,name',
                'sizes:id,name',
                'images:id,product_id,path,sort_order',
                'kitchen:id,name',
            ])
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->each(fn (Product $product) => $product->images->each->append('url'));

        $openOrders = Order::query()
            ->select([
                'id',
                'branch_id',
                'branch_table_id',
                'user_id',
                'client_id',
                'order_type',
                'customer_name',
                'customer_phone',
                'delivery_address',
                'covered_by_employee_id',
                'covered_by_note',
                'sub_total_amount',
                'total_amount',
                'paid_amount',
                'status',
                'created_at',
            ])
            ->with([
                'branch:id,name',
                'branchTable:id,branch_id,table_number,title,description,is_active',
                'user:id,name',
                'coveredByEmployee:id,branch_id,first_name,last_name,phone',
                'payments:id,order_id,method,amount,currency,payment_date',
                'items:id,order_id,product_id,product_size_id,kitchen_id,quantity,price,line_total,product_name_snapshot,prep_status,started_at,ready_at,delivered_at',
                'items.product:id,name,product_category_id,kitchen_id',
                'items.product.images:id,product_id,path,sort_order',
                'items.productSize:id,name',
                'items.kitchen:id,name',
            ])
            ->whereNotIn('status', [
                OrderStatus::COMPLETED->value,
                OrderStatus::CANCELLED->value,
            ])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->latest()
            ->get();

        $activeOrdersByTable = $openOrders
            ->filter(fn (Order $order) => $order->branch_table_id !== null)
            ->unique('branch_table_id')
            ->keyBy('branch_table_id');

        $tables = BranchTable::query()
            ->select(['id', 'branch_id', 'table_number', 'title', 'description', 'is_active'])
            ->where('is_active', true)
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->with('branch:id,name')
            ->get()
            ->sortBy(fn (BranchTable $table) => sprintf(
                '%08d-%s',
                (int) preg_replace('/\D+/', '', (string) $table->table_number),
                (string) $table->table_number,
            ))
            ->map(function (BranchTable $table) use ($activeOrdersByTable) {
                $activeOrder = $activeOrdersByTable->get($table->id);

                $status = $activeOrder
                    ? (string) ($activeOrder->status?->value ?? $activeOrder->status ?? 'pending')
                    : 'empty';

                return [
                    'id' => $table->id,
                    'branch_id' => $table->branch_id,
                    'table_number' => (string) $table->table_number,
                    'title' => $table->title,
                    'description' => $table->description,
                    'status' => $status,
                    'branch' => $table->branch ? [
                        'id' => $table->branch->id,
                        'name' => $table->branch->name,
                    ] : null,
                    'active_order' => $activeOrder,
                    'elapsed_label' => $activeOrder?->created_at
                        ? Carbon::parse($activeOrder->created_at)->diffForHumans(now(), true)
                        : null,
                ];
            })
            ->values();

        $categoryOptions = $products
            ->map(fn (Product $product) => $product->category)
            ->filter()
            ->unique('id')
            ->values()
            ->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
            ]);

        return [
            'mode' => $roleMode,
            'branchId' => $branchId,
            'products' => $products,
            'customers' => Customer::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->orderBy('phone')
                ->get(['id', 'name', 'phone', 'email']),
            'discountCards' => DiscountCard::query()
                ->active()
                ->orderBy('name')
                ->get(),
            'sponsorEmployees' => Employee::query()
                ->where('is_active', true)
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get([
                    'id',
                    'branch_id',
                    'first_name',
                    'last_name',
                    'phone',
                ])
                ->map(fn (Employee $employee) => [
                    'id' => $employee->id,
                    'branch_id' => $employee->branch_id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'full_name' => trim($employee->first_name.' '.$employee->last_name),
                    'phone' => $employee->phone,
                ])
                ->values(),
            'categories' => $categoryOptions,
            'tables' => $tables,
            'openOrders' => $openOrders->values(),
            'summary' => [
                'dineInOpen' => $openOrders->where('order_type', OrderType::DINE_IN->value)->count(),
                'takeawayOpen' => $openOrders->where('order_type', OrderType::TAKEAWAY->value)->count(),
                'deliveryOpen' => $openOrders->where('order_type', OrderType::DELIVERY->value)->count(),
                'readyToPay' => $openOrders->where('status', OrderStatus::READY->value)->count(),
            ],
        ];
    }

    private function resolveRoleMode(User $user): string
    {
        if ($user->hasRole('cashier')) {
            return 'cashier';
        }

        if ($user->hasRole('server')) {
            return 'server';
        }

        if ($user->hasRole('order-taker')) {
            return 'order-taker';
        }

        return 'general';
    }
}
