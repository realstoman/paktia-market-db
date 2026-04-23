<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class DiscountCard extends Model
{
    protected $fillable = [
        'name',
        'code',
        'discount_type',
        'discount_value',
        'max_discount_amount',
        'description',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
