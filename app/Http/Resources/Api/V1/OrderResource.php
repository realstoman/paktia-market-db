<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->branch?->name,
            'branch_table_id' => $this->branch_table_id,
            'branch_table_number' => $this->branchTable?->table_number,
            'user_id' => $this->user_id,
            'created_by' => $this->user?->name,
            'order_type' => $this->order_type?->value ?? $this->order_type,
            'status' => $this->status?->value ?? $this->status,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'delivery_address' => $this->delivery_address,
            'base_currency' => $this->base_currency,
            'exchange_rate' => $this->exchange_rate !== null ? (float) $this->exchange_rate : null,
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => (float) $this->paid_amount,
            'change_amount' => (float) $this->change_amount,
            'items_count' => $this->items_count ?? $this->items?->count() ?? 0,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
