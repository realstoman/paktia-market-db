<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductCategory;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        ProductCategory::insert([
            ['name' => 'Main Dishes'],
            ['name' => 'Grill'],
            ['name' => 'Drinks'],
            ['name' => 'Desserts'],
            ['name' => 'Gift Packages'],
        ]);
    }
}
