<?php

namespace App\Services\Location;

use App\Models\Property;
use App\Services\Caching\CatalogCacheService;

class PropertyService
{
    public function __construct(
        private readonly CatalogCacheService $catalogCacheService,
    ) {}

    public function create(array $data): Property
    {
        $property = Property::create($data);
        $this->catalogCacheService->invalidateProperty($property);

        return $property;
    }

    public function update(Property $property, array $data): Property
    {
        $property->update($data);
        $this->catalogCacheService->invalidateProperty($property);

        return $property;
    }

    public function toggleActive(Property $property): Property
    {
        $property->update(['is_active' => ! $property->is_active]);
        $this->catalogCacheService->invalidateProperty($property);

        return $property;
    }

    public function delete(Property $property): void
    {
        $property->delete();
        $this->catalogCacheService->invalidateReferenceData();
    }

    public function getIndexData(): array
    {
        $properties = Property::with(['country', 'province', 'parentProperty:id,name,name_translations'])
            ->withCount(['floors', 'units'])
            ->latest()
            ->get();

        $properties->transform(function (Property $property) {
            return [
                'id' => $property->id,
                'name' => $property->name,
                'parent_property_id' => $property->parent_property_id,
                'parent_property' => $property->parentProperty,
                'property_type' => $property->property_type,
                'usage_type' => $property->usage_type,
                'image_url' => $property->image_url,
                'address' => $property->address,
                'description' => $property->description,
                'land_area_sqm' => $property->land_area_sqm,
                'building_area_sqm' => $property->building_area_sqm,
                'declared_floors' => $property->declared_floors,
                'declared_units' => $property->declared_units,
                'floors_count' => $property->floors_count,
                'units_count' => $property->units_count,
                'is_active' => $property->is_active,
                'created_at' => $property->created_at,
                'updated_at' => $property->updated_at,
                'country' => $property->country?->name,
                'country_id' => $property->country_id,
                'country_object' => $property->country,
                'province' => $property->province?->name,
                'province_id' => $property->province_id,
                'province_object' => $property->province,
            ];
        });

        return [
            'properties' => $properties,
        ];
    }
}
