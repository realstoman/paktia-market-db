<?php

use App\Models\Country;
use App\Models\Property;
use App\Models\PropertyFloor;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\App;
use Inertia\Testing\AssertableInertia as Assert;

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

test('properties keep their saved order and new properties are appended', function () {
    [$country, $province] = propertyLocation();

    Property::query()->create([
        'name' => 'Zahir Plaza',
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $province->id,
    ]);

    $this->post(route('properties.store'), [
        'name' => 'Ahmad Market',
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $province->id,
    ])->assertRedirect(route('properties.index'));

    $this->get(route('properties.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('properties.0.name', 'Zahir Plaza')
            ->where('properties.0.display_order', 1)
            ->where('properties.1.name', 'Ahmad Market')
            ->where('properties.1.display_order', 2));
});

test('property display order can be adjusted', function () {
    [$country, $province] = propertyLocation();
    $properties = collect(['First Market', 'Second Market', 'Third Market'])
        ->map(fn (string $name) => Property::query()->create([
            'name' => $name,
            'property_type' => 'market',
            'usage_type' => 'commercial',
            'country_id' => $country->id,
            'province_id' => $province->id,
        ]));

    $this->patch(route('properties.order.update', $properties[2]), [
        'direction' => 'up',
    ])->assertRedirect()
        ->assertSessionHas('success', __('properties.actions.order_updated'));

    expect(Property::query()
        ->orderBy('display_order')
        ->pluck('name')
        ->all())->toBe(['First Market', 'Third Market', 'Second Market']);
});

test('success and error flashes are shared as global toast messages', function () {
    $this->withSession([
        'success' => 'Record saved successfully.',
        'error' => 'The record could not be saved.',
    ])->get(route('properties.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('flash.success.message', 'Record saved successfully.')
            ->has('flash.success.id')
            ->where('flash.error.message', 'The record could not be saved.')
            ->has('flash.error.id'));
});

test('property create dialog can be opened from the dashboard action', function () {
    $this->get(route('properties.index', ['create' => 1]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('openCreate', true));
});

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
    ])->assertRedirect(route('properties.index'))
        ->assertSessionHas('success', __('properties.actions.created'));

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

test('another location can be linked to the original property in a different province', function () {
    [$country, $province] = propertyLocation();
    $secondProvince = Province::query()->create([
        'country_id' => $country->id,
        'name' => 'Paktia',
    ]);
    $original = Property::query()->create([
        'name' => 'National Market - Kabul',
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $province->id,
    ]);

    $this->post(route('properties.store'), [
        'name' => 'National Market - Paktia',
        'parent_property_id' => $original->id,
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $secondProvince->id,
    ])->assertRedirect(route('properties.index'));

    $this->assertDatabaseHas('properties', [
        'name' => 'National Market - Paktia',
        'parent_property_id' => $original->id,
        'province_id' => $secondProvince->id,
    ]);
});

test('property content follows the active locale and falls back to Dari', function () {
    [$country, $province] = propertyLocation();

    $this->post(route('properties.store'), [
        'name' => 'مارکیت مرکزی',
        'name_ps' => 'مرکزي مارکېټ',
        'name_en' => 'Central Market',
        'address' => 'کابل، شهر نو',
        'address_en' => 'Shahr-e Naw, Kabul',
        'description' => 'مارکیت تجارتی',
        'description_en' => 'Commercial market',
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $province->id,
    ])->assertRedirect(route('properties.index'));

    $property = Property::query()->latest('id')->firstOrFail();

    App::setLocale('ps');
    expect($property->fresh()->name)->toBe('مرکزي مارکېټ')
        ->and($property->fresh()->address)->toBe('کابل، شهر نو');

    App::setLocale('en');
    expect($property->fresh()->name)->toBe('Central Market')
        ->and($property->fresh()->address)->toBe('Shahr-e Naw, Kabul')
        ->and($property->fresh()->description)->toBe('Commercial market');
});

test('property details and translations can be edited', function () {
    [$country, $province] = propertyLocation();
    $property = Property::query()->create([
        'name' => 'مارکیت قدیمی',
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $province->id,
    ]);

    $this->post(route('properties.update', $property), [
        '_method' => 'put',
        'name' => 'مارکیت جدید',
        'name_ps' => 'نوی مارکېټ',
        'name_en' => 'New Market',
        'property_type' => 'mall',
        'usage_type' => 'mixed',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'building_area_sqm' => 900,
    ])->assertRedirect(route('properties.show', $property));

    $this->assertDatabaseHas('properties', [
        'id' => $property->id,
        'name' => 'مارکیت جدید',
        'property_type' => 'mall',
        'usage_type' => 'mixed',
        'building_area_sqm' => 900,
    ]);

    App::setLocale('en');
    expect($property->fresh()->name)->toBe('New Market');
});
