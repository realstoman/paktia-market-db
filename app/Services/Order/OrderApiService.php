<?php

namespace App\Services\Order;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class OrderApiService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        $query = Order::query()
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
                'total_amount',
                'paid_amount',
                'status',
                'created_at',
            ])
            ->with([
                'branch:id,name',
                'branchTable:id,branch_id,table_number,title',
                'user:id,name',
                'client:id,first_name,last_name,phone',
                'items:id,order_id,product_id,product_size_id,kitchen_id,quantity,price,product_name_snapshot',
                'items.product:id,name,product_category_id',
                'items.product.categories:id,name',
                'items.product.category:id,name',
                'items.productSize:id,name',
                'items.kitchen:id,name',
            ])
            ->withCount('items');

        $this->applyFilters($query, $filters);

        return $query
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getById(Order $order): Order
    {
        return $order->load([
            'branch',
            'branchTable',
            'user',
            'client',
            'items.product.category',
            'items.productSize',
            'items.kitchen',
        ])->loadCount('items');
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $query
            ->when(
                $filters['status'] ?? null,
                fn (Builder $q, string $status) => $q->where('status', $status)
            )
            ->when(
                $filters['type'] ?? null,
                fn (Builder $q, string $type) => $q->where('order_type', $type)
            )
            ->when(
                $filters['branch_id'] ?? null,
                fn (Builder $q, int $branchId) => $q->where('branch_id', $branchId)
            )
            ->when(
                $filters['user_id'] ?? null,
                fn (Builder $q, int $userId) => $q->where('user_id', $userId)
            )
            ->when(
                $filters['branch_table_id'] ?? null,
                fn (Builder $q, int $tableId) => $q->where('branch_table_id', $tableId)
            )
            ->when(
                $filters['date_from'] ?? null,
                fn (Builder $q, string $dateFrom) => $q->whereDate('created_at', '>=', $dateFrom)
            )
            ->when(
                $filters['date_to'] ?? null,
                fn (Builder $q, string $dateTo) => $q->whereDate('created_at', '<=', $dateTo)
            )
            ->when(
                $filters['q'] ?? null,
                function (Builder $q, string $term): void {
                    $q->where(function (Builder $searchQuery) use ($term): void {
                        $normalized = trim($term);

                        $searchQuery
                            ->where('customer_name', 'like', "%{$normalized}%")
                            ->orWhere('customer_phone', 'like', "%{$normalized}%");

                        if (ctype_digit($normalized)) {
                            $searchQuery->orWhereKey((int) $normalized);
                        }
                    });
                }
            )
            ->when(
                ($filters['product_id'] ?? null)
                || ($filters['category_id'] ?? null)
                || ($filters['kitchen_id'] ?? null),
                function (Builder $q) use ($filters): void {
                    $q->whereHas('items', function (Builder $itemQuery) use ($filters): void {
                        $itemQuery
                            ->when(
                                $filters['product_id'] ?? null,
                                fn (Builder $iq, int $productId) => $iq->where('product_id', $productId)
                            )
                            ->when(
                                $filters['kitchen_id'] ?? null,
                                fn (Builder $iq, int $kitchenId) => $iq->where('kitchen_id', $kitchenId)
                            )
                            ->when(
                                $filters['category_id'] ?? null,
                                fn (Builder $iq, int $categoryId) => $iq
                                    ->whereHas('product', fn (Builder $pq) => $pq
                                        ->whereHas(
                                            'categories',
                                            fn (Builder $categoryQuery) => $categoryQuery->where('product_categories.id', $categoryId),
                                        ))
                            );
                    });
                }
            );
    }
}
