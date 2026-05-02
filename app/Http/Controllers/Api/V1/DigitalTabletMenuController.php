<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DigitalTabletMenuProductResource;
use App\Services\Product\DigitalTabletMenuProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DigitalTabletMenuController extends Controller
{
    public function products(
        DigitalTabletMenuProductService $service,
    ): AnonymousResourceCollection {
        return DigitalTabletMenuProductResource::collection($service->all());
    }
}
