<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Country;
use App\Models\Province;
use App\Models\Property;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'AF')->first();
        $province = Province::where('name', 'Kabul')->first();
        $property = Property::where('name', 'Paktia Market – Kabul')->first();

        $user = User::firstOrCreate(
            ['email' => 'stoman@email.com'],
            [
                'name' => 'Stoman',
                'password' => bcrypt('password'),
                'country_id' => $country?->id,
                'province_id' => $province?->id,
                'property_id' => $property?->id,
            ]
        );

        $user->assignRole('super-admin');
    }
}
