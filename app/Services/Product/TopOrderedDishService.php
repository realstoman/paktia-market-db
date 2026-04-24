<?php

namespace App\Services\Product;

use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TopOrderedDishService
{
    public function get(int $limit = 6): Collection
    {
        $limit = max(1, $limit);

        $topRows = OrderItem::query()
            ->selectRaw('order_items.product_id, SUM(order_items.quantity) as total_quantity')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->whereNotNull('order_items.product_id')
            ->where('orders.status', '!=', 'cancelled')
            ->where('products.type', 'food')
            ->groupBy('order_items.product_id')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();

        if ($topRows->isEmpty()) {
            return collect();
        }

        $products = Product::query()
            ->with(['category', 'images'])
            ->whereIn('id', $topRows->pluck('product_id'))
            ->get()
            ->keyBy('id');

        return $topRows
            ->map(function ($row) use ($products) {
                /** @var Product|null $product */
                $product = $products->get($row->product_id);

                if (! $product) {
                    return null;
                }

                return [
                    'id' => $product->id,
                    'product_name' => $product->name,
                    'product_name_fa' => $product->dari_name,
                    'product_name_ps' => $product->pashto_name,
                    'name' => $product->name,
                    'dari_name' => $product->dari_name,
                    'pashto_name' => $product->pashto_name,
                    'category_name' => $product->category?->name,
                    'price' => (float) $product->base_price,
                    'image_url' => $product->images->first()?->url,
                    'link' => '/products/'.Str::slug($product->name),
                    'api_link' => url('/api/v1/products/'.$product->id),
                    'total_quantity' => (int) $row->total_quantity,
                ];
            })
            ->filter()
            ->values();
    }
}
