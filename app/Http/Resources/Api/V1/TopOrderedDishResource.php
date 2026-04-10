<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopOrderedDishResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'name' => $this['name'],
            'pashto_name' => $this['pashto_name'],
            'dari_name' => $this['dari_name'],
            'category_name' => $this['category_name'],
            'price' => (float) $this['price'],
            'image_url' => $this['image_url'],
            'link' => $this['link'],
            'api_link' => $this['api_link'],
            'total_quantity' => (int) $this['total_quantity'],
        ];
    }
}
