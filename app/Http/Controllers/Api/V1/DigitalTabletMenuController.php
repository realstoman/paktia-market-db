<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DigitalTabletMenuProductResource;
use App\Http\Resources\Api\V1\ProductCategoryResource;
use App\Http\Resources\Api\V1\ProductTypeResource;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Services\Product\DigitalTabletMenuProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DigitalTabletMenuController extends Controller
{
    public function products(
        DigitalTabletMenuProductService $service,
    ): AnonymousResourceCollection {
        return DigitalTabletMenuProductResource::collection($service->all());
    }

    public function categories(
        DigitalTabletMenuProductService $service,
    ): AnonymousResourceCollection {
        return ProductCategoryResource::collection($service->categories());
    }

    public function productsByCategory(
        ProductCategory $category,
        DigitalTabletMenuProductService $service,
    ): AnonymousResourceCollection {
        return DigitalTabletMenuProductResource::collection(
            $service->productsByCategory($category)
        );
    }

    public function types(
        DigitalTabletMenuProductService $service,
    ): AnonymousResourceCollection {
        return ProductTypeResource::collection($service->types());
    }

    public function productsByType(
        ProductType $type,
        DigitalTabletMenuProductService $service,
    ): AnonymousResourceCollection {
        return DigitalTabletMenuProductResource::collection(
            $service->productsByType($type)
        );
    }
}
