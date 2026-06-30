<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\PropertyType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PropertyTypeController extends Controller
{
    public function store(Request $request)
    {
        $validated = $this->validateType($request);
        $key = $this->makeUniqueKey($validated['name_en'] ?? $validated['name']);

        PropertyType::query()->create([
            'key' => $key,
            'name' => $validated['name'],
            'name_translations' => [
                'fa' => $validated['name'],
                'ps' => $validated['name_ps'] ?? null,
                'en' => $validated['name_en'] ?? null,
            ],
            'behavior' => $validated['behavior'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', __('properties.actions.type_saved'));
    }

    public function update(Request $request, PropertyType $propertyType)
    {
        $validated = $this->validateType($request, $propertyType);

        $propertyType->update([
            'name' => $validated['name'],
            'name_translations' => [
                'fa' => $validated['name'],
                'ps' => $validated['name_ps'] ?? null,
                'en' => $validated['name_en'] ?? null,
            ],
            'behavior' => $validated['behavior'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', __('properties.actions.type_saved'));
    }

    private function validateType(Request $request, ?PropertyType $type = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'name_ps' => ['nullable', 'string', 'max:120'],
            'name_en' => ['nullable', 'string', 'max:120'],
            'behavior' => ['required', Rule::in(['market', 'block', 'house', 'commercial_unit'])],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    private function makeUniqueKey(string $name): string
    {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'property-type';
        }

        $key = $base;
        $suffix = 2;

        while (PropertyType::query()->where('key', $key)->exists()) {
            $key = "{$base}-{$suffix}";
            $suffix++;
        }

        return $key;
    }
}
