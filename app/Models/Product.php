<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public function category()
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function sizes()
    {
        return $this->belongsToMany(ProductSize::class)
            ->withPivot('price');
    }
}
