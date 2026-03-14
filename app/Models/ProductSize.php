<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSize extends Model
{
    protected $fillable = [
        'name',
        'code',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_size_prices')
            ->withPivot('price')
            ->withTimestamps();
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class, 'product_size_id');
    }

}
