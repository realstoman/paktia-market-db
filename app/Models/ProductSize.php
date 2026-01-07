<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSize extends Model
{
    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_size_prices')
            ->withPivot('price')
            ->withTimestamps();
    }

}
