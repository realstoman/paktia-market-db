<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductSize;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $category = ProductCategory::where('name', 'Main Dishes')->first();

        $product = Product::create([
            'product_category_id' => $category->id,
            'name' => 'Qabuli Palaw',
            'description' => 'Traditional Afghan rice dish',
            'type' => 'food',
            'base_price' => 450,
            'is_active' => true,
        ]);

        // Optional sizes (Qabuli may not need size, this is just example)
        $sizes = ProductSize::all();
        foreach ($sizes as $size) {
            $product->sizes()->attach($size->id, [
                'price' => $product->base_price + rand(50, 150),
            ]);
        }
    }
}
