<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashMovementType extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'default_direction',
        'requires_counterparty',
        'is_active',
        'sort_order',
        'description',
    ];

    protected $casts = [
        'requires_counterparty' => 'boolean',
        'is_active' => 'boolean',
    ];
}
