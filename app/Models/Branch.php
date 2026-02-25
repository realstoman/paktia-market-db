<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = [
        'name',
        'country_id',
        'province_id',
        'address',
        'description',
        'is_active',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function province()
    {
        return $this->belongsTo(Province::class);
    }

    public function kitchens()
    {
        return $this->belongsToMany(Kitchen::class)->withTimestamps();
    }

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function tables()
    {
        return $this->hasMany(BranchTable::class);
    }
}
