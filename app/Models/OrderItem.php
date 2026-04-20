<?php

namespace App\Models;

use App\Enums\OrderItemPrepStatus;
use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use Auditable;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name_snapshot',
        'product_size_id',
        'product_size_name_snapshot',
        'kitchen_id',
        'prep_status',
        'quantity',
        'price',
        'line_total',
        'note',
        'started_at',
        'ready_at',
        'delivered_at',
        'prepared_by',
        'kitchen_receipt_printed_at',
    ];

    protected $casts = [
        'prep_status' => OrderItemPrepStatus::class,
        'started_at' => 'datetime',
        'ready_at' => 'datetime',
        'delivered_at' => 'datetime',
        'kitchen_receipt_printed_at' => 'datetime',
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

    public function preparedBy()
    {
        return $this->belongsTo(User::class, 'prepared_by');
    }
}
