<?php

namespace App\Services\Location;

use App\Models\Property;
use App\Services\Caching\CatalogCacheService;
use Illuminate\Support\Facades\DB;

class PropertyService
{
    public function __construct(
        private readonly CatalogCacheService $catalogCacheService,
    ) {}

    public function create(array $data): Property
    {
        $property = DB::transaction(function () use ($data): Property {
            $data['display_order'] = ((int) Property::query()
                ->lockForUpdate()
                ->max('display_order')) + 1;

            return Property::create($data);
        });
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

    public function reorder(Property $property, string $direction): bool
    {
        $moved = DB::transaction(function () use ($property, $direction): bool {
            $properties = Property::query()
                ->orderBy('display_order')
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id', 'display_order'])
                ->values();
            $currentIndex = $properties->search(
                fn (Property $item) => $item->id === $property->id,
            );

            if ($currentIndex === false) {
                return false;
            }

            $targetIndex = $direction === 'up'
                ? $currentIndex - 1
                : $currentIndex + 1;

            if (! $properties->has($targetIndex)) {
                return false;
            }

            $current = $properties->get($currentIndex);
            $target = $properties->get($targetIndex);
            $properties->put($currentIndex, $target);
            $properties->put($targetIndex, $current);

            $properties->values()->each(function (Property $item, int $index): void {
                $nextOrder = $index + 1;

                if ($item->display_order !== $nextOrder) {
                    $item->forceFill(['display_order' => $nextOrder])->saveQuietly();
                }
            });

            return true;
        });

        if ($moved) {
            $this->catalogCacheService->invalidateReferenceData();
        }

        return $moved;
    }

    public function getIndexData(): array
    {
        $properties = Property::with(['country', 'province', 'parentProperty:id,name,name_translations'])
            ->withCount(['floors', 'units'])
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        $properties->transform(function (Property $property) {
            return [
                'id' => $property->id,
                'name' => $property->name,
                'parent_property_id' => $property->parent_property_id,
                'parent_property' => $property->parentProperty,
                'property_type' => $property->property_type,
                'usage_type' => $property->usage_type,
                'host_market_name' => $property->host_market_name,
                'external_unit_number' => $property->external_unit_number,
                'external_floor' => $property->external_floor,
                'ownership_type' => $property->ownership_type,
                'operating_mode' => $property->operating_mode,
                'business_activities' => $property->business_activities,
                'title_deed_number' => $property->title_deed_number,
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
                'display_order' => $property->display_order,
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
