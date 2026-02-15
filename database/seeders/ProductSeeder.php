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
        $categories = ProductCategory::all()->keyBy('name');
        $sizes = ProductSize::all();

        $products = [
            [
                'category' => 'Main Dishes',
                'name' => 'Qabuli Palaw',
                'description' => 'Traditional Afghan rice dish',
                'type' => 'food',
                'base_price' => 450,
            ],
            [
                'category' => 'Main Dishes',
                'name' => 'Mantu',
                'description' => 'Steamed dumplings with meat sauce',
                'type' => 'food',
                'base_price' => 380,
            ],
            [
                'category' => 'Grill',
                'name' => 'Chapli Kebab',
                'description' => 'Spiced minced meat patties',
                'type' => 'food',
                'base_price' => 420,
            ],
            [
                'category' => 'Grill',
                'name' => 'Chicken Tikka',
                'description' => 'Char-grilled chicken skewers',
                'type' => 'food',
                'base_price' => 410,
            ],
            [
                'category' => 'Drinks',
                'name' => 'Doogh',
                'description' => 'Yogurt mint drink',
                'type' => 'beverage',
                'base_price' => 120,
            ],
            [
                'category' => 'Drinks',
                'name' => 'Green Tea',
                'description' => 'Classic Afghan green tea',
                'type' => 'beverage',
                'base_price' => 80,
            ],
            [
                'category' => 'Desserts',
                'name' => 'Firni',
                'description' => 'Cardamom custard pudding',
                'type' => 'dessert',
                'base_price' => 150,
            ],
            [
                'category' => 'Gift Packages',
                'name' => 'Family Platter',
                'description' => 'Combo platter for gatherings',
                'type' => 'bundle',
                'base_price' => 1200,
            ],
        ];

        foreach ($products as $entry) {
            $category = $categories->get($entry['category']);

            if (!$category) {
                continue;
            }

            $product = Product::create([
                'product_category_id' => $category->id,
                'name' => $entry['name'],
                'description' => $entry['description'],
                'type' => $entry['type'],
                'base_price' => $entry['base_price'],
                'is_active' => true,
            ]);

            foreach ($sizes as $size) {
                $product->sizes()->attach($size->id, [
                    'price' => $product->base_price + rand(50, 200),
                ]);
            }
        }
    }
}
