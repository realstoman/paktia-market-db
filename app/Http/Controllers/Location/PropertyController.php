<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Property;
use App\Models\PropertyDocument;
use App\Models\PropertyFloor;
use App\Models\PropertyType;
use App\Models\PropertyUnit;
use App\Models\Province;
use App\Services\Location\PropertyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
            'propertyTypes' => $this->propertyTypes(),
        ]);
    }

    public function show(Property $property)
    {
        return Inertia::render('location/properties/show', [
            'property' => $property->load([
                'country', 'province', 'typeDefinition', 'parentProperty.country', 'parentProperty.province',
                'relatedLocations.country', 'relatedLocations.province',
                'documents', 'images',
                'floors' => fn ($query) => $query->with('units')->orderBy('level_number'),
            ]),
            'countries' => Country::orderBy('name')->get(),
            'provinces' => Province::orderBy('name')->get(),
            'propertyOptions' => Property::query()
                ->whereKeyNot($property->id)
                ->orderBy('display_order')
                ->orderBy('id')
                ->get(['id', 'name', 'name_translations', 'property_type', 'country_id', 'province_id']),
            'propertyTypes' => $this->propertyTypes(),
        ]);
    }

    public function update(Request $request, PropertyService $service, Property $property)
    {
        $validated = $this->validateProperty($request);
        $validated = $this->prepareTranslations($validated);
        $validated = $this->storeImage($request, $validated, $property);

        $service->update($property, $validated);
        $this->storeGalleryImages($request, $property);

        return redirect()->route('properties.show', $property)
            ->with('success', __('properties.actions.updated'));
    }

    public function store(Request $request, PropertyService $service)
    {
        $validated = $this->validateProperty($request);
        $validated = $this->prepareTranslations($validated);
        $validated = $this->storeImage($request, $validated);

        $property = $service->create($validated);
        $this->storeGalleryImages($request, $property);

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
        abort_if(in_array($property->typeBehavior(), ['house', 'commercial_unit'], true), 422);

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

    public function updateFloor(Request $request, Property $property, PropertyFloor $floor)
    {
        abort_unless($floor->property_id === $property->id, 404);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'level_number' => [
                'required', 'integer', 'between:-10,200',
                Rule::unique('property_floors')->where('property_id', $property->id)->ignore($floor->id),
            ],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'planned_units' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'usage_type' => ['nullable', Rule::in(['commercial', 'residential', 'mixed', 'service', 'parking'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);
        $floor->update($validated);

        return back()->with('success', __('properties.actions.floor_updated'));
    }

    public function storeUnit(Request $request, Property $property, PropertyFloor $floor)
    {
        abort_unless($floor->property_id === $property->id, 404);
        $behavior = $property->typeBehavior();
        abort_if(in_array($behavior, ['house', 'commercial_unit'], true), 422);

        $validated = $request->validate([
            'unit_type' => ['required', Rule::in(['shop', 'apartment'])],
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

        $floor->units()->create($validated);

        return back()->with(
            'success',
            __("properties.actions.{$validated['unit_type']}_added"),
        );
    }

    public function destroyUnit(Property $property, PropertyFloor $floor, PropertyUnit $unit)
    {
        abort_unless($floor->property_id === $property->id && $unit->property_floor_id === $floor->id, 404);
        $unit->delete();

        return back()->with('success', __('properties.actions.space_deleted'));
    }

    public function updateUnit(Request $request, Property $property, PropertyFloor $floor, PropertyUnit $unit)
    {
        abort_unless($floor->property_id === $property->id && $unit->property_floor_id === $floor->id, 404);
        $validated = $request->validate([
            'unit_type' => ['required', Rule::in(['shop', 'apartment'])],
            'unit_number' => [
                'required', 'string', 'max:50',
                Rule::unique('property_units')->where('property_floor_id', $floor->id)->ignore($unit->id),
            ],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'width_m' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'length_m' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'rooms_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'kitchens_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'halls_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'bathrooms_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'occupancy_status' => ['required', Rule::in(['vacant', 'occupied', 'reserved', 'maintenance'])],
            'electricity_meter' => ['nullable', 'string', 'max:100'],
            'water_meter' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);
        $unit->update($validated);

        return back()->with('success', __('properties.actions.space_updated'));
    }

    public function uploadDocuments(Request $request, Property $property)
    {
        $validated = $request->validate([
            'document_type' => ['required', Rule::in(['title_deed', 'purchase_contract', 'ownership', 'other'])],
            'documents' => ['required', 'array', 'min:1', 'max:10'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ]);

        foreach ($request->file('documents', []) as $file) {
            $path = $file->store("properties/{$property->id}/documents", 'local');
            $property->documents()->create([
                'document_type' => $validated['document_type'],
                'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'document_number' => $property->title_deed_number,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size_bytes' => $file->getSize(),
            ]);
        }

        return back()->with('success', __('properties.actions.documents_uploaded'));
    }

    public function downloadDocument(Property $property, PropertyDocument $document): StreamedResponse
    {
        abort_unless($document->property_id === $property->id, 404);

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    public function destroyDocument(Property $property, PropertyDocument $document)
    {
        abort_unless($document->property_id === $property->id, 404);
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return back()->with('success', __('properties.actions.document_deleted'));
    }

    public function uploadImages(Request $request, Property $property)
    {
        $this->validateImages($request, $property);
        $this->storeGalleryImages($request, $property);

        return back()->with('success', __('properties.actions.images_uploaded'));
    }

    private function validateProperty(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'name_ps' => ['nullable', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'parent_property_id' => [
                'nullable',
                'integer',
                'exists:properties,id',
                Rule::notIn(array_filter([$request->route('property')?->id])),
            ],
            'property_type' => ['required', 'exists:property_types,key'],
            'usage_type' => ['required', Rule::in(['commercial', 'residential', 'mixed'])],
            'host_market_name' => ['nullable', 'string', 'max:255'],
            'host_market_name_ps' => ['nullable', 'string', 'max:255'],
            'host_market_name_en' => ['nullable', 'string', 'max:255'],
            'external_unit_number' => ['nullable', 'string', 'max:100'],
            'external_floor' => ['nullable', 'string', 'max:100'],
            'ownership_type' => ['nullable', Rule::in(['owned', 'leased', 'managed'])],
            'operating_mode' => ['nullable', Rule::in(['owner_occupied', 'vacant', 'rented', 'maintenance'])],
            'business_activities' => ['nullable', 'array', 'max:10'],
            'business_activities.*' => ['string', Rule::in(['money_exchange', 'jewelry', 'office', 'retail', 'other'])],
            'title_deed_number' => ['nullable', 'string', 'max:150'],
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
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:width=1920,height=1080'],
        ]);

        if ($this->propertyTypeBehavior($validated['property_type']) === 'commercial_unit') {
            $missing = [];

            if (blank($validated['host_market_name'] ?? null)) {
                $missing['host_market_name'] = __('validation.required', ['attribute' => 'host market name']);
            }

            if (blank($validated['external_unit_number'] ?? null)) {
                $missing['external_unit_number'] = __('validation.required', ['attribute' => 'shop / office number']);
            }

            if ($missing !== []) {
                throw ValidationException::withMessages($missing);
            }
        }

        return $validated;
    }

    private function validateImages(Request $request, Property $property): void
    {
        $remainingSlots = max(0, 10 - $property->images()->count());

        $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:'.$remainingSlots],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:width=1920,height=1080'],
        ]);
    }

    private function storeImage(Request $request, array $validated, ?Property $property = null): array
    {
        unset($validated['image'], $validated['images']);

        if ($request->hasFile('image')) {
            if ($property?->image_path) {
                Storage::disk('public')->delete($property->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('properties', 'public');
        }

        return $validated;
    }

    private function storeGalleryImages(Request $request, Property $property): void
    {
        $images = $request->file('images', []);
        if (! count($images)) {
            return;
        }

        $existingCount = $property->images()->count();
        foreach (array_slice($images, 0, max(0, 10 - $existingCount)) as $index => $image) {
            $path = $image->store("properties/{$property->id}/images", 'public');

            $property->images()->create([
                'path' => $path,
                'original_name' => $image->getClientOriginalName(),
                'mime_type' => $image->getMimeType(),
                'size_bytes' => $image->getSize(),
                'sort_order' => $existingCount + $index + 1,
            ]);

            if ($existingCount === 0 && $index === 0 && blank($property->image_path)) {
                $property->forceFill(['image_path' => $path])->saveQuietly();
            }
        }
    }

    private function prepareTranslations(array $validated): array
    {
        $validated['ownership_type'] = $validated['ownership_type'] ?? 'owned';
        $validated['operating_mode'] = $validated['operating_mode'] ?? 'owner_occupied';

        foreach (['name', 'address', 'description', 'host_market_name'] as $field) {
            $validated["{$field}_translations"] = array_filter([
                'fa' => $validated[$field] ?? null,
                'ps' => $validated["{$field}_ps"] ?? null,
                'en' => $validated["{$field}_en"] ?? null,
            ], fn ($value) => filled($value));

            unset($validated["{$field}_ps"], $validated["{$field}_en"]);
        }

        if ($this->propertyTypeBehavior($validated['property_type'] ?? null) === 'commercial_unit') {
            $validated['usage_type'] = 'commercial';
            $validated['parent_property_id'] = null;
            $validated['land_area_sqm'] = null;
            $validated['declared_units'] = 1;
        } else {
            $validated['host_market_name'] = null;
            $validated['host_market_name_translations'] = [];
            $validated['external_unit_number'] = null;
            $validated['external_floor'] = null;
            $validated['business_activities'] = null;
            $validated['title_deed_number'] = null;
        }

        return $validated;
    }

    private function propertyTypeBehavior(?string $key): string
    {
        return PropertyType::query()->where('key', $key)->value('behavior')
            ?? match ($key) {
                'mall' => 'market',
                'market', 'block', 'house', 'commercial_unit' => $key,
                default => 'market',
            };
    }

    private function propertyTypes()
    {
        return PropertyType::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'key', 'name', 'name_translations', 'behavior', 'is_active', 'sort_order']);
    }
}
