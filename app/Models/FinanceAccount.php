<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinanceAccount extends Model
{
    protected $fillable = [
        'code',
        'name',
        'type',
        'parent_id',
        'branch_id',
        'currency_code',
        'is_postable',
        'is_system',
        'status',
        'description',
    ];

    protected $casts = [
        'is_postable' => 'boolean',
        'is_system' => 'boolean',
    ];
}
