<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'branch_id',
        'branch_table_id',
        'user_id',
        'order_type',
        'customer_name',
        'customer_phone',
        'delivery_address',
        'base_currency',
        'exchange_rate',
        'total_amount',
        'paid_amount',
        'change_amount',
        'status',
    ];

    protected $casts = [
        'order_type' => OrderType::class,
        'status' => OrderStatus::class,
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branchTable()
    {
        return $this->belongsTo(BranchTable::class, 'branch_table_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
