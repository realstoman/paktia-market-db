<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('countries')->insert([
            [
                'name' => 'Afghanistan',
                'code' => 'AF',
                'currency_code' => 'AFN',
                'currency_symbol' => '؋',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'United Arab Emirates',
                'code' => 'AE',
                'currency_code' => 'AED',
                'currency_symbol' => 'د.إ',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
