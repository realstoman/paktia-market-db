<?php

use App\Models\Property;
use App\Models\Country;
use App\Models\PropertyFloor;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->create()->assignRole('super-admin'));
});

function propertyLocation(): array
{
    $country = Country::query()->create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ]);
    $province = Province::query()->create(['country_id' => $country->id, 'name' => 'Kabul']);

    return [$country, $province];
}

test('a market can be registered with its portfolio details', function () {
    [$country, $province] = propertyLocation();

    $this->post(route('properties.store'), [
        'name' => 'Central Market',
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'address' => 'Main road',
        'land_area_sqm' => 2500,
        'building_area_sqm' => 1800,
        'declared_floors' => 4,
        'declared_units' => 120,
    ])->assertRedirect(route('properties.index'));

    $this->assertDatabaseHas('properties', [
        'name' => 'Central Market',
        'property_type' => 'market',
        'declared_units' => 120,
    ]);
});

test('floors support basements and market spaces are always shops', function () {
    [$country, $province] = propertyLocation();
    $property = Property::query()->create([
        'name' => 'City Mall', 'property_type' => 'mall', 'usage_type' => 'commercial',
        'country_id' => $country->id, 'province_id' => $province->id,
    ]);

    $this->post(route('properties.floors.store', $property), [
        'name' => 'Basement 1', 'level_number' => -1, 'planned_units' => 12,
    ])->assertRedirect();

    $floor = PropertyFloor::query()->whereBelongsTo($property, 'property')->firstOrFail();

    $this->post(route('properties.floors.units.store', [$property, $floor]), [
        'unit_number' => 'B-01',
        'unit_type' => 'apartment',
        'width_m' => 4,
        'length_m' => 6,
    ])->assertRedirect();

    $this->assertDatabaseHas('property_floors', ['property_id' => $property->id, 'level_number' => -1]);
    $this->assertDatabaseHas('property_units', [
        'property_floor_id' => $floor->id,
        'unit_number' => 'B-01',
        'unit_type' => 'shop',
        'occupancy_status' => 'vacant',
    ]);
});

test('residential block spaces are always apartments', function () {
    [$country, $province] = propertyLocation();
    $property = Property::query()->create([
        'name' => 'Family Block', 'property_type' => 'block', 'usage_type' => 'residential',
        'country_id' => $country->id, 'province_id' => $province->id,
    ]);
    $floor = $property->floors()->create(['name' => 'First floor', 'level_number' => 1]);

    $this->post(route('properties.floors.units.store', [$property, $floor]), [
        'unit_number' => 'A-1', 'unit_type' => 'shop', 'rooms_count' => 3,
        'kitchens_count' => 1, 'halls_count' => 1, 'bathrooms_count' => 2,
    ])->assertRedirect();

    $this->assertDatabaseHas('property_units', [
        'property_floor_id' => $floor->id,
        'unit_number' => 'A-1',
        'unit_type' => 'apartment',
        'rooms_count' => 3,
    ]);
});
