<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchSyncCredential extends Model
{
    protected $fillable = [
        'branch_id',
        'name',
        'token_hash',
        'abilities',
        'last_used_at',
        'expires_at',
        'revoked_at',
    ];

    protected $casts = [
        'abilities' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
