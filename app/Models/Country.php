<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    public function provinces()
    {
        return $this->hasMany(Province::class);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }
}

