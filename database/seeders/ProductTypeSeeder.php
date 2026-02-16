<?php

namespace Database\Seeders;

use App\Models\ProductType;
use Illuminate\Database\Seeder;

class ProductTypeSeeder extends Seeder
{
    public function run(): void
    {
        ProductType::insert([
            ['name' => 'food'],
            ['name' => 'beverage'],
            ['name' => 'dessert'],
            ['name' => 'bundle'],
        ]);
    }
}
