<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchSyncCursor extends Model
{
    protected $fillable = [
        'branch_id',
        'direction',
        'last_synced_at',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
