<?php

namespace App\Http\Resources\Api\V1\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_image_url' => $this->product?->images?->first()?->url,
            'product_size_id' => $this->product_size_id,
            'size_name' => $this->productSize?->name,
            'quantity' => (int) $this->quantity,
            'note' => $this->note,
            'unit_price' => (float) $this->unit_price,
            'line_total' => (float) $this->line_total,
        ];
    }
}
