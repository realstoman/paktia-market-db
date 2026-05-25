<?php

namespace App\Services\Mobile;

use App\Models\Client;
use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MobileOrderService
{
    public function paginateForClient(Client $client, int $perPage = 15): LengthAwarePaginator
    {
        return Order::query()
            ->where('client_id', $client->id)
            ->with([
                'branch',
                'client',
                'items.product.category',
                'items.product.images',
                'items.productSize',
                'items.kitchen',
            ])
            ->withCount('items')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getForClient(Client $client, Order $order): Order
    {
        abort_unless($order->client_id === $client->id, 404);

        return $order->load([
            'branch',
            'client',
            'items.product.category',
            'items.product.images',
            'items.productSize',
            'items.kitchen',
        ])->loadCount('items');
    }
}
