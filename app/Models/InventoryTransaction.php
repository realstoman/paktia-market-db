<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use Auditable;

    protected $fillable = [
        'inventory_item_id',
        'action',
        'quantity',
        'unit_cost',
        'total_cost',
        'weighted_average_cost_after',
        'note',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:2',
        'weighted_average_cost_after' => 'decimal:4',
    ];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
