<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Property;
use App\Models\Country;
use App\Models\Province;

class PropertySeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'AF')->first();
        $province = Province::where('name', 'Kabul')->first();

        Property::create([
            'name' => 'Paktia Market – Kabul',
            'country_id' => $country->id,
            'province_id' => $province->id,
            'description' => 'Main property in the Kabul',
        ]);
    }
}
