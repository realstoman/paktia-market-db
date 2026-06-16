<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Country;
use App\Models\Province;
use App\Models\Branch;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'AF')->first();
        $province = Province::where('name', 'Kabul')->first();
        $branch = Branch::where('name', 'Paktia Market – Kabul')->first();

        $user = User::firstOrCreate(
            ['email' => 'stoman@email.com'],
            [
                'name' => 'Stoman',
                'password' => bcrypt('password'),
                'country_id' => $country?->id,
                'province_id' => $province?->id,
                'branch_id' => $branch?->id,
            ]
        );

        $user->assignRole('super-admin');
    }
}
