<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Province;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'AF')->first();
        $province = Province::where('name', 'Kabul')->first();

        Branch::create([
            'name' => 'Paktia Market – Kabul',
            'country_id' => $country->id,
            'province_id' => $province->id,
            'description' => 'Main branch in the Kabul',
        ]);
    }
}
