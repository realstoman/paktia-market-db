<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use Auditable;

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

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }

}
