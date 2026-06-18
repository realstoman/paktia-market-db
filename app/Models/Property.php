<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use Auditable;

    protected $fillable = [
        'parent_property_id',
        'name',
        'property_type',
        'usage_type',
        'image_path',
        'country_id',
        'province_id',
        'address',
        'description',
        'distance_from_city_km',
        'land_area_sqm',
        'building_area_sqm',
        'declared_floors',
        'declared_units',
        'rooms_count',
        'kitchens_count',
        'halls_count',
        'bathrooms_count',
        'parking_spaces',
        'year_built',
        'amenities',
        'notes',
        'is_active',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'amenities' => 'array',
            'is_active' => 'boolean',
            'distance_from_city_km' => 'decimal:2',
            'land_area_sqm' => 'decimal:2',
            'building_area_sqm' => 'decimal:2',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? asset('storage/'.$this->image_path) : null;
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function parentProperty()
    {
        return $this->belongsTo(self::class, 'parent_property_id');
    }

    public function relatedLocations()
    {
        return $this->hasMany(self::class, 'parent_property_id')->orderBy('name');
    }

    public function province()
    {
        return $this->belongsTo(Province::class);
    }

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function floors()
    {
        return $this->hasMany(PropertyFloor::class)->orderBy('level_number');
    }

    public function units()
    {
        return $this->hasManyThrough(PropertyUnit::class, PropertyFloor::class);
    }
}
