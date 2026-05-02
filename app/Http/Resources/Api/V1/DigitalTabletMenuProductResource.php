<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DigitalTabletMenuProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $firstImage = $this->images?->first();
        $sizePrices = $this->sizes
            ?->map(fn ($size) => [
                'id' => $size->id,
                'name' => $size->name,
                'price' => isset($size->pivot?->price)
                    ? (float) $size->pivot->price
                    : null,
            ])
            ->values()
            ->all() ?? [];

        return [
            'id' => $this->id,
            'name' => $this->name,
            'dari_name' => $this->dari_name,
            'pashto_name' => $this->pashto_name,
            'product_category_id' => $this->product_category_id,
            'product_category_name' => $this->category?->name,
            'product_type' => $this->type,
            'product_type_id' => $this->product_type_id,
            'price' => (float) $this->base_price,
            'size_prices' => $sizePrices,
            'image' => $firstImage
                ? [
                    'path' => $firstImage->path,
                    'url' => $firstImage->url,
                ]
                : null,
        ];
    }
}
