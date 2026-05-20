<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;

class DigitalTabletMenuProductResource extends ProductResource
{
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }
}
