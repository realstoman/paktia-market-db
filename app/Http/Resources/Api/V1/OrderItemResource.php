<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
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
            'quantity' => (int) $this->quantity,
            'price' => (float) $this->price,
            'line_total' => (float) ($this->line_total ?? ($this->price * $this->quantity)),
            'note' => $this->note,
        ];
    }
}
