<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $fillable = [
        'name',
        'code',
        'currency_code',
        'currency_symbol',
        'is_active',
    ];

    public function provinces()
    {
        return $this->hasMany(Province::class);
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }
}
