<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
