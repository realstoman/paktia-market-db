<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestSession extends Model
{
    protected $fillable = [
        'token',
        'device_id',
        'platform',
        'app_version',
        'expires_at',
        'merged_at',
        'is_active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'merged_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query
            ->where('is_active', true)
            ->where(function ($innerQuery): void {
                $innerQuery->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }
}
