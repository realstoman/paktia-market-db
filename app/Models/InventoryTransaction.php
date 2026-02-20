<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'inventory_item_id',
        'action',
        'quantity',
        'note',
    ];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
