<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'pashto_name' => $this->pashto_name,
            'dari_name' => $this->dari_name,
            'description' => $this->description,
            'pashto_description' => $this->pashto_description,
            'dari_description' => $this->dari_description,
            'product_category_id' => $this->product_category_id,
            'category_name' => $this->category?->name,
            'kitchen_id' => $this->kitchen_id,
            'kitchen_name' => $this->kitchen?->name,
            'type' => $this->type,
            'base_price' => (float) $this->base_price,
            'is_active' => (bool) $this->is_active,
            'images_count' => $this->images_count ?? $this->images?->count() ?? 0,
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
