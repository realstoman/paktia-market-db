<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdempotencyRequest extends Model
{
    protected $fillable = [
        'idempotency_key',
        'scope',
        'method',
        'route',
        'fingerprint',
        'response_status',
        'response_headers',
        'response_body',
        'completed_at',
        'expires_at',
    ];

    protected $casts = [
        'response_headers' => 'array',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
