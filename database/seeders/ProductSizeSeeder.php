<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSizeSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('product_sizes')->insert([
            ['name' => 'Small'],
            ['name' => 'Medium'],
            ['name' => 'Large'],
            ['name' => 'Family'],
        ]);
    }
}
