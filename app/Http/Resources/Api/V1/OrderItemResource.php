<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $price = (float) $this->price;
        $quantity = (int) $this->quantity;
        $computedLineTotal = $price * $quantity;
        $storedLineTotal = $this->line_total !== null
            ? (float) $this->line_total
            : null;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name_snapshot ?? $this->product?->name,
            'product_category_id' => $this->product?->product_category_id,
            'product_category_name' => $this->product?->category?->name,
            'product_size_id' => $this->product_size_id,
            'product_size_name' => $this->product_size_name_snapshot ?? $this->productSize?->name,
            'kitchen_id' => $this->kitchen_id,
            'kitchen_name' => $this->kitchen?->name,
            'quantity' => $quantity,
            'price' => $price,
            'line_total' => $storedLineTotal === null || ($storedLineTotal === 0.0 && $computedLineTotal > 0)
                ? $computedLineTotal
                : $storedLineTotal,
            'note' => $this->note,
        ];
    }
}
