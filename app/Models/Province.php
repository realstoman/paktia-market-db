<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $fillable = [
        'country_id',
        'name',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }
}
