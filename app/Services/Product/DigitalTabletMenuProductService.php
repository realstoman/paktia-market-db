<?php

namespace App\Services\Product;

use App\Models\Product;
use App\Models\ProductType;
use Illuminate\Support\Collection;

class DigitalTabletMenuProductService
{
    public function all(): Collection
    {
        $typeIdByName = ProductType::query()
            ->pluck('id', 'name')
            ->mapWithKeys(
                fn ($id, $name) => [strtolower(trim((string) $name)) => (int) $id],
            );

        return Product::query()
            ->with(['images', 'sizes'])
            ->where('is_active', true)
            ->orderBy('product_category_id')
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) use ($typeIdByName) {
                $normalizedType = strtolower(trim((string) $product->type));

                $product->setAttribute(
                    'product_type_id',
                    $typeIdByName[$normalizedType] ?? null,
                );

                return $product;
            });
    }
}
