<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;

class DigitalTabletMenuProductResource extends ProductResource
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

        $productCategories = $this->whenLoaded(
            'categories',
            fn () => $this->categories->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'dari_name' => $category->dari_name,
                'pashto_name' => $category->pashto_name,
            ])->values()->all(),
        );

        $categoryIds = $this->whenLoaded(
            'categories',
            fn () => $this->categories->pluck('id')->values()->all(),
            [$this->product_category_id],
        );

        $secondaryCategory = $this->whenLoaded(
            'categories',
            fn () => $this->categories
                ->first(fn ($category) => (int) $category->id !== (int) $this->product_category_id),
        );

        return array_merge(parent::toArray($request), [
            'product_category_name' => $this->category?->name,
            'product_category_dari_name' => $this->category?->dari_name,
            'product_category_pashto_name' => $this->category?->pashto_name,
            'product_category_ids' => $categoryIds,
            'product_categories' => $productCategories,
            'secondary_category_id' => $secondaryCategory?->id,
            'secondary_category_name' => $secondaryCategory?->name,
            'secondary_category_dari_name' => $secondaryCategory?->dari_name,
            'secondary_category_pashto_name' => $secondaryCategory?->pashto_name,
            'product_type_id' => $this->product_type_id,
            'product_type_pashto_name' => $this->product_type_pashto_name,
            'product_type_dari_name' => $this->product_type_dari_name,
            'price' => (float) $this->base_price,
            'size_prices' => $sizePrices,
            'image' => $firstImage
                ? [
                    'path' => $firstImage->path,
                    'url' => $firstImage->url,
                ]
                : null,
        ]);
    }
}
