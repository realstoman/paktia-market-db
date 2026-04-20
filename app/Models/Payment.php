<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use Auditable;

    protected $fillable = [
        'order_id',
        'currency',
        'amount',
        'exchange_rate',
        'method',
        'payment_date',
        'status',
        'received_by',
        'reference_number',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'payment_date' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
