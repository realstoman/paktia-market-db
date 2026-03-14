<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name_snapshot',
        'product_size_id',
        'product_size_name_snapshot',
        'kitchen_id',
        'quantity',
        'price',
        'line_total',
        'note',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function kitchen()
    {
        return $this->belongsTo(Kitchen::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function productSize()
    {
        return $this->belongsTo(ProductSize::class);
    }
}
