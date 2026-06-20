<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Property;
use App\Models\PropertyFloor;
use App\Models\PropertyUnit;
use App\Models\Province;
use App\Services\Location\PropertyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PropertyController extends Controller
{
    public function index(Request $request, PropertyService $service)
    {
        return Inertia::render('location/properties/index', [
            ...$service->getIndexData(),
            'openCreate' => $request->boolean('create'),
            'countries' => Country::orderBy('name')->get(),
            'provinces' => Province::orderBy('name')->get(),
            'propertyOptions' => Property::query()
                ->orderBy('display_order')
                ->orderBy('id')
                ->get(['id', 'name', 'name_translations', 'property_type', 'country_id', 'province_id']),
        ]);
    }

    public function show(Property $property)
    {
        return Inertia::render('location/properties/show', [
            'property' => $property->load([
                'country', 'province', 'parentProperty.country', 'parentProperty.province',
                'relatedLocations.country', 'relatedLocations.province',
                'floors' => fn ($query) => $query->with('units')->orderBy('level_number'),
            ]),
            'countries' => Country::orderBy('name')->get(),
            'provinces' => Province::orderBy('name')->get(),
            'propertyOptions' => Property::query()
                ->whereKeyNot($property->id)
                ->orderBy('display_order')
                ->orderBy('id')
                ->get(['id', 'name', 'name_translations', 'property_type', 'country_id', 'province_id']),
        ]);
    }

    public function update(Request $request, PropertyService $service, Property $property)
    {
        $validated = $this->validateProperty($request);
        $validated = $this->prepareTranslations($validated);
        $validated = $this->storeImage($request, $validated, $property);

        $service->update($property, $validated);

        return redirect()->route('properties.show', $property)
            ->with('success', __('properties.actions.updated'));
    }

    public function store(Request $request, PropertyService $service)
    {
        $validated = $this->validateProperty($request);
        $validated = $this->prepareTranslations($validated);
        $validated = $this->storeImage($request, $validated);

        $service->create($validated);

        return redirect()->route('properties.index')
            ->with('success', __('properties.actions.created'));
    }

    public function disable(PropertyService $service, Property $property)
    {
        $service->toggleActive($property);

        $message = $property->is_active
            ? __('properties.actions.activated')
            : __('properties.actions.disabled');

        return redirect()->route('properties.index')
            ->with('success', $message);
    }

    public function reorder(Request $request, PropertyService $service, Property $property)
    {
        $validated = $request->validate([
            'direction' => ['required', Rule::in(['up', 'down'])],
        ]);

        $service->reorder($property, $validated['direction']);

        return back()->with('success', __('properties.actions.order_updated'));
    }

    public function destroy(PropertyService $service, Property $property)
    {
        $service->delete($property);

        return redirect()->route('properties.index')
            ->with('success', __('properties.actions.deleted'));
    }

    public function storeFloor(Request $request, Property $property)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'level_number' => [
                'required', 'integer', 'between:-10,200',
                Rule::unique('property_floors')->where('property_id', $property->id),
            ],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'planned_units' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'usage_type' => ['nullable', Rule::in(['commercial', 'residential', 'mixed', 'service', 'parking'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $property->floors()->create($validated);

        return back()->with('success', __('properties.actions.floor_added'));
    }

    public function destroyFloor(Property $property, PropertyFloor $floor)
    {
        abort_unless($floor->property_id === $property->id, 404);
        $floor->delete();

        return back()->with('success', __('properties.actions.floor_deleted'));
    }

    public function storeUnit(Request $request, Property $property, PropertyFloor $floor)
    {
        abort_unless($floor->property_id === $property->id, 404);

        $expectedType = in_array($property->property_type, ['market', 'mall'], true) ? 'shop' : 'apartment';
        $validated = $request->validate([
            'unit_number' => [
                'required', 'string', 'max:50',
                Rule::unique('property_units')->where('property_floor_id', $floor->id),
            ],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'width_m' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'length_m' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'rooms_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'kitchens_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'halls_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'bathrooms_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'occupancy_status' => ['nullable', Rule::in(['vacant', 'occupied', 'reserved', 'maintenance'])],
            'electricity_meter' => ['nullable', 'string', 'max:100'],
            'water_meter' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $floor->units()->create(['unit_type' => $expectedType, ...$validated]);

        return back()->with(
            'success',
            __("properties.actions.{$expectedType}_added"),
        );
    }

    public function destroyUnit(Property $property, PropertyFloor $floor, PropertyUnit $unit)
    {
        abort_unless($floor->property_id === $property->id && $unit->property_floor_id === $floor->id, 404);
        $unit->delete();

        return back()->with('success', __('properties.actions.space_deleted'));
    }

    private function validateProperty(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'name_ps' => ['nullable', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'parent_property_id' => [
                'nullable',
                'integer',
                'exists:properties,id',
                Rule::notIn(array_filter([$request->route('property')?->id])),
            ],
            'property_type' => ['required', Rule::in(['market', 'mall', 'block', 'house'])],
            'usage_type' => ['required', Rule::in(['commercial', 'residential', 'mixed'])],
            'country_id' => ['required', 'exists:countries,id'],
            'province_id' => [
                'required',
                Rule::exists('provinces', 'id')->where('country_id', $request->integer('country_id')),
            ],
            'address' => ['nullable', 'string', 'max:500'],
            'address_ps' => ['nullable', 'string', 'max:500'],
            'address_en' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:2000'],
            'description_ps' => ['nullable', 'string', 'max:2000'],
            'description_en' => ['nullable', 'string', 'max:2000'],
            'distance_from_city_km' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'land_area_sqm' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'building_area_sqm' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'declared_floors' => ['nullable', 'integer', 'min:0', 'max:500'],
            'declared_units' => ['nullable', 'integer', 'min:0', 'max:50000'],
            'rooms_count' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'kitchens_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'halls_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'bathrooms_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'parking_spaces' => ['nullable', 'integer', 'min:0', 'max:50000'],
            'year_built' => ['nullable', 'integer', 'between:1800,'.(now()->year + 10)],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);
    }

    private function storeImage(Request $request, array $validated, ?Property $property = null): array
    {
        unset($validated['image']);

        if ($request->hasFile('image')) {
            if ($property?->image_path) {
                Storage::disk('public')->delete($property->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('properties', 'public');
        }

        return $validated;
    }

    private function prepareTranslations(array $validated): array
    {
        foreach (['name', 'address', 'description'] as $field) {
            $validated["{$field}_translations"] = array_filter([
                'fa' => $validated[$field] ?? null,
                'ps' => $validated["{$field}_ps"] ?? null,
                'en' => $validated["{$field}_en"] ?? null,
            ], fn ($value) => filled($value));

            unset($validated["{$field}_ps"], $validated["{$field}_en"]);
        }

        return $validated;
    }
}
