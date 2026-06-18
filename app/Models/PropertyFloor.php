<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class PropertyFloor extends Model
{
    use Auditable;

    protected $fillable = [
        'branch_id', 'name', 'level_number', 'area_sqm', 'planned_units',
        'usage_type', 'description', 'is_active',
    ];

    protected function casts(): array
    {
        return ['area_sqm' => 'decimal:2', 'is_active' => 'boolean'];
    }

    public function property()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function units()
    {
        return $this->hasMany(PropertyUnit::class)->orderBy('unit_number');
    }
}
