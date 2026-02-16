<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'product_category_id',
        'kitchen_id',
        'name',
        'description',
        'type',
        'base_price',
        'is_active',
    ];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function kitchen()
    {
        return $this->belongsTo(Kitchen::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function sizes()
    {
        return $this->belongsToMany(ProductSize::class, 'product_size_prices')
        ->withPivot('price')
        ->withTimestamps();
    }
}
