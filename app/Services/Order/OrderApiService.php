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
            ->with([
                'branch',
                'branchTable',
                'user',
                'client',
                'items.product.category',
                'items.productSize',
                'items.kitchen',
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
                        $searchQuery
                            ->where('customer_name', 'like', "%{$term}%")
                            ->orWhere('customer_phone', 'like', "%{$term}%")
                            ->orWhere('id', 'like', "%{$term}%");
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
                                        ->where('product_category_id', $categoryId))
                            );
                    });
                }
            );
    }
}
