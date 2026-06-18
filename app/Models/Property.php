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
        'name_translations',
        'property_type',
        'usage_type',
        'image_path',
        'country_id',
        'province_id',
        'address',
        'address_translations',
        'description',
        'description_translations',
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
            'name_translations' => 'array',
            'address_translations' => 'array',
            'description_translations' => 'array',
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

    public function getNameAttribute(?string $value): string
    {
        return $this->translatedValue('name_translations', $value) ?? '';
    }

    public function getAddressAttribute(?string $value): ?string
    {
        return $this->translatedValue('address_translations', $value);
    }

    public function getDescriptionAttribute(?string $value): ?string
    {
        return $this->translatedValue('description_translations', $value);
    }

    private function translatedValue(string $attribute, ?string $fallback): ?string
    {
        $translations = $this->getAttribute($attribute) ?? [];
        $locale = app()->getLocale();

        return filled($translations[$locale] ?? null)
            ? $translations[$locale]
            : (filled($translations['fa'] ?? null) ? $translations['fa'] : $fallback);
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

    public function shareholdings()
    {
        return $this->hasMany(PropertyShareholding::class)->latest('effective_from');
    }

    public function shareholders()
    {
        return $this->belongsToMany(Shareholder::class, 'property_shareholdings')
            ->withPivot(['percentage', 'capital_contribution', 'currency_id', 'effective_from', 'effective_to', 'notes'])
            ->withTimestamps();
    }
}
