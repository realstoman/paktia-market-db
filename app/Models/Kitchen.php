<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kitchen extends Model
{
    protected $fillable = [
        'branch_id',
        'name',
        'type',
        'is_active',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
