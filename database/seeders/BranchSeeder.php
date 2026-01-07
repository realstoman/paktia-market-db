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
            'name' => 'Baba Restaurant – Kabul',
            'country_id' => $country->id,
            'province_id' => $province->id,
            'description' => 'Main flagship branch in Kabul',
        ]);
    }
}
