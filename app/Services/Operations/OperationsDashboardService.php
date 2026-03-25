<?php

namespace App\Services\Operations;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\BranchTable;
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
            ->with(['category', 'sizes', 'images', 'kitchen'])
            ->where('is_active', true)
            ->when($branchId, fn ($query) => $query->whereHas('kitchen.branches', fn ($branchQuery) => $branchQuery->where('branches.id', $branchId)))
            ->orderBy('name')
            ->get();

        $openOrders = Order::query()
            ->with([
                'branch:id,name',
                'branchTable:id,branch_id,table_number,title,description,is_active',
                'user:id,name',
                'payments',
                'items.product.images',
                'items.productSize',
                'items.kitchen:id,name',
            ])
            ->whereNotIn('status', [
                OrderStatus::COMPLETED->value,
                OrderStatus::CANCELLED->value,
            ])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->latest()
            ->get();

        $tables = BranchTable::query()
            ->where('is_active', true)
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->with('branch:id,name')
            ->orderBy('table_number')
            ->get()
            ->map(function (BranchTable $table) use ($openOrders) {
                $activeOrder = $openOrders
                    ->where('branch_table_id', $table->id)
                    ->sortByDesc('id')
                    ->first();

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
