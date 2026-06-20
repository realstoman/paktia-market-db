<?php

namespace App\Services\Location;

use App\Models\Country;

class CountryService
{
    public function getIndexData(): array
    {
        $countries = Country::with(['provinces', 'properties'])
            ->orderBy('name')
            ->get();

        $countries->transform(function (Country $country) {
            return [
                'id' => $country->id,
                'name' => $country->name,
                'name_en' => $country->name_en,
                'name_translations' => $country->name_translations,
                'code' => $country->code,
                'currency_code' => $country->currency_code,
                'currency_symbol' => $country->currency_symbol,
                'is_active' => $country->is_active,
                'created_at' => $country->created_at,
                'updated_at' => $country->updated_at,
                'provinces' => $country->provinces,
                'properties' => $country->properties,
            ];
        });

        return [
            'countries' => $countries,
        ];
    }

    public function create(array $data): Country
    {
        return Country::create($data);
    }

    public function update(Country $country, array $data): Country
    {
        $country->update($data);
        return $country;
    }

    public function toggleActive(Country $country): Country
    {
        $country->update(['is_active' => ! $country->is_active]);
        return $country;
    }

    public function delete(Country $country): void
    {
        $country->delete();
    }
}
