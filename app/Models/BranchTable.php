<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchTable extends Model
{
    protected $fillable = [
        'branch_id',
        'table_number',
        'title',
        'description',
        'is_active',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
