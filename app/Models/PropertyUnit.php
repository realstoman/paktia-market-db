<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class PropertyUnit extends Model
{
    use Auditable;

    protected $fillable = [
        'property_floor_id', 'unit_type', 'unit_number', 'area_sqm', 'width_m',
        'length_m', 'rooms_count', 'kitchens_count', 'halls_count',
        'bathrooms_count', 'occupancy_status', 'electricity_meter', 'water_meter',
        'description', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'area_sqm' => 'decimal:2', 'width_m' => 'decimal:2',
            'length_m' => 'decimal:2', 'is_active' => 'boolean',
        ];
    }

    public function floor()
    {
        return $this->belongsTo(PropertyFloor::class, 'property_floor_id');
    }
}
