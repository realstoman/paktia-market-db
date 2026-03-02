<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryCurrency extends Model
{
    protected $fillable = [
        'name',
        'code',
        'symbol',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

