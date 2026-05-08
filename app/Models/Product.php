<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use Auditable;

    protected $fillable = [
        'product_category_id',
        'cuisine_id',
        'kitchen_id',
        'name',
        'pashto_name',
        'dari_name',
        'description',
        'pashto_description',
        'dari_description',
        'type',
        'base_price',
        'is_active',
    ];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function cuisine()
    {
        return $this->belongsTo(Cuisine::class);
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
            ->withTimestamps()
            ->orderBy('product_sizes.id');
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }
}
