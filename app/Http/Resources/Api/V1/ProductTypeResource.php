<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductTypeResource extends JsonResource
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
            'image_path' => $this->image_path,
            'image_url' => $this->image_url,
            'products_count' => (int) ($this->products_count ?? 0),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
