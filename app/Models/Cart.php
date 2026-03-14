<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = [
        'client_id',
        'guest_session_id',
        'branch_id',
        'status',
        'currency_code',
        'subtotal',
        'discount_total',
        'delivery_fee',
        'total',
        'checked_out_at',
        'expires_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'checked_out_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function guestSession()
    {
        return $this->belongsTo(GuestSession::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class)->orderBy('id');
    }
}
