<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Province;
use App\Models\Country;

class ProvinceSeeder extends Seeder
{
    public function run(): void
    {
        $afghanistan = Country::where('code', 'AF')->first();

        $provinces = [
            'Kabul',
            'Herat',
            'Kandahar',
            'Balkh',
            'Paktia',
        ];

        foreach ($provinces as $province) {
            Province::create([
                'country_id' => $afghanistan->id,
                'name' => $province,
            ]);
        }
    }
}
