<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use Auditable;

    protected $fillable = [
        'branch_id',
        'branch_table_id',
        'user_id',
        'client_id',
        'order_type',
        'source',
        'customer_name',
        'customer_phone',
        'delivery_address',
        'customer_note',
        'base_currency',
        'exchange_rate',
        'sub_total_amount',
        'discount_amount',
        'tax_amount',
        'service_charge_amount',
        'total_amount',
        'paid_amount',
        'change_amount',
        'refund_amount',
        'status',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'order_type' => OrderType::class,
        'status' => OrderStatus::class,
        'exchange_rate' => 'decimal:4',
        'sub_total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'service_charge_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
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
