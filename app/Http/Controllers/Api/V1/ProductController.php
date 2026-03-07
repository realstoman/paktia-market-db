<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\ProductCategoryResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Http\Resources\Api\V1\ProductTypeResource;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Services\Product\ProductApiService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(ProductIndexRequest $request, ProductApiService $service): AnonymousResourceCollection
    {
        $products = $service->paginate($request->validated());

        return ProductResource::collection($products);
    }

    public function show(Product $product, ProductApiService $service): ProductResource
    {
        return ProductResource::make($service->getById($product));
    }

    public function categories(ProductApiService $service): AnonymousResourceCollection
    {
        return ProductCategoryResource::collection($service->categories());
    }

    public function showCategory(ProductCategory $category, ProductApiService $service): ProductCategoryResource
    {
        return ProductCategoryResource::make($service->category($category));
    }

    public function types(ProductApiService $service): AnonymousResourceCollection
    {
        return ProductTypeResource::collection($service->types());
    }

    public function showType(ProductType $type, ProductApiService $service): ProductTypeResource
    {
        return ProductTypeResource::make($service->type($type));
    }
}
