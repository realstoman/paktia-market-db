<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryType extends Model
{
    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class, 'inventory_type_id');
    }
}
