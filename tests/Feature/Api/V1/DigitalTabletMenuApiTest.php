<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductSize;
use App\Models\ProductType;
use App\Models\Province;

function createDigitalTabletMenuBaseData(): array
{
    $country = Country::create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
        'is_active' => true,
    ]);

    $province = Province::create([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);

    $branch = Branch::create([
        'name' => 'Baba Main',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'is_active' => true,
    ]);

    $kitchen = Kitchen::create([
        'branch_id' => $branch->id,
        'name' => 'Hot Kitchen',
        'is_active' => true,
    ]);

    return [$branch, $kitchen];
}

test('digital tablet menu products endpoint returns the dedicated tablet payload', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $category = ProductCategory::create([
        'name' => 'Main Dishes',
    ]);

    $type = ProductType::create([
        'name' => 'food',
        'pashto_name' => 'خواړه',
        'dari_name' => 'غذا',
    ]);

    $small = ProductSize::create(['name' => 'Small', 'code' => 'S']);
    $large = ProductSize::create(['name' => 'Large', 'code' => 'L']);

    $product = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Qabuli Palaw',
        'pashto_name' => 'قابلي پلو',
        'dari_name' => 'قابلی پلو',
        'type' => 'food',
        'base_price' => 450,
        'is_active' => true,
    ]);

    $product->images()->createMany([
        ['path' => 'products/qabuli-1.jpg', 'sort_order' => 0],
        ['path' => 'products/qabuli-2.jpg', 'sort_order' => 1],
    ]);

    $product->sizes()->sync([
        $small->id => ['price' => 400],
        $large->id => ['price' => 650],
    ]);

    Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Inactive Product',
        'type' => 'food',
        'base_price' => 100,
        'is_active' => false,
    ]);

    $this->getJson('/api/v1/digital-tablet-menu/products')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $product->id)
        ->assertJsonPath('data.0.name', 'Qabuli Palaw')
        ->assertJsonPath('data.0.dari_name', 'قابلی پلو')
        ->assertJsonPath('data.0.pashto_name', 'قابلي پلو')
        ->assertJsonPath('data.0.product_category_id', $category->id)
        ->assertJsonPath('data.0.type', 'food')
        ->assertJsonPath('data.0.product_type_id', $type->id)
        ->assertJsonPath('data.0.price', 450)
        ->assertJsonPath('data.0.size_prices.0.name', 'Small')
        ->assertJsonPath('data.0.size_prices.0.price', 400)
        ->assertJsonPath('data.0.size_prices.1.name', 'Large')
        ->assertJsonPath('data.0.size_prices.1.price', 650)
        ->assertJsonPath('data.0.first_image.path', 'products/qabuli-1.jpg')
        ->assertJsonPath('data.0.first_image.url', '/storage/products/qabuli-1.jpg');
});
