<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'type',
        'unit',
        'quantity',
        'is_usable',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function images()
    {
        return $this->hasMany(InventoryItemImage::class)->orderBy('sort_order');
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class)->latest();
    }
}
