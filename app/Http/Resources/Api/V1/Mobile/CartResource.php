<?php

namespace App\Http\Resources\Api\V1\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'branch_id' => $this->branch_id,
            'currency_code' => $this->currency_code,
            'owner_type' => $this->client_id ? 'client' : 'guest',
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'totals' => [
                'subtotal' => (float) $this->subtotal,
                'discount_total' => (float) $this->discount_total,
                'delivery_fee' => (float) $this->delivery_fee,
                'total' => (float) $this->total,
            ],
        ];
    }
}
