<?php

use App\Models\Branch;
use App\Models\Cuisine;
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

test('digital tablet menu products endpoint returns the full product payload plus tablet compatibility fields', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $category = ProductCategory::create([
        'name' => 'Main Dishes',
        'dari_name' => 'غذاهای اصلی',
        'pashto_name' => 'اصلي خواړه',
    ]);
    $cuisine = Cuisine::firstOrCreate(['name' => 'Afghan']);

    $type = ProductType::create([
        'name' => 'food',
        'pashto_name' => 'خواړه',
        'dari_name' => 'غذا',
    ]);

    $small = ProductSize::create(['name' => 'Small', 'code' => 'S']);
    $large = ProductSize::create(['name' => 'Large', 'code' => 'L']);

    $product = Product::create([
        'product_category_id' => $category->id,
        'cuisine_id' => $cuisine->id,
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
        ->assertJsonPath('data.0.description', null)
        ->assertJsonPath('data.0.pashto_description', null)
        ->assertJsonPath('data.0.dari_description', null)
        ->assertJsonPath('data.0.product_category_id', $category->id)
        ->assertJsonPath('data.0.category_name', 'Main Dishes')
        ->assertJsonPath('data.0.category_dari_name', 'غذاهای اصلی')
        ->assertJsonPath('data.0.category_pashto_name', 'اصلي خواړه')
        ->assertJsonPath('data.0.product_category_name', 'Main Dishes')
        ->assertJsonPath('data.0.product_category_dari_name', 'غذاهای اصلی')
        ->assertJsonPath('data.0.product_category_pashto_name', 'اصلي خواړه')
        ->assertJsonPath('data.0.cuisine_id', $cuisine->id)
        ->assertJsonPath('data.0.cuisine_name', 'Afghan')
        ->assertJsonPath('data.0.kitchen_id', $kitchen->id)
        ->assertJsonPath('data.0.kitchen_name', 'Hot Kitchen')
        ->assertJsonPath('data.0.type', 'food')
        ->assertJsonPath('data.0.product_type', 'food')
        ->assertJsonPath('data.0.type_pashto_name', 'خواړه')
        ->assertJsonPath('data.0.type_dari_name', 'غذا')
        ->assertJsonPath('data.0.product_type_id', $type->id)
        ->assertJsonPath('data.0.product_type_pashto_name', 'خواړه')
        ->assertJsonPath('data.0.product_type_dari_name', 'غذا')
        ->assertJsonPath('data.0.price', 450)
        ->assertJsonPath('data.0.base_price', 450)
        ->assertJsonPath('data.0.sizes.0.name', 'Small')
        ->assertJsonPath('data.0.sizes.0.code', 'S')
        ->assertJsonPath('data.0.sizes.0.price', 400)
        ->assertJsonPath('data.0.sizes.1.name', 'Large')
        ->assertJsonPath('data.0.sizes.1.code', 'L')
        ->assertJsonPath('data.0.sizes.1.price', 650)
        ->assertJsonPath('data.0.size_prices.0.name', 'Small')
        ->assertJsonPath('data.0.size_prices.0.price', 400)
        ->assertJsonPath('data.0.size_prices.1.name', 'Large')
        ->assertJsonPath('data.0.size_prices.1.price', 650)
        ->assertJsonPath('data.0.is_active', true)
        ->assertJsonPath('data.0.images_count', 2)
        ->assertJsonPath('data.0.image.path', 'products/qabuli-1.jpg')
        ->assertJsonPath('data.0.image.url', '/storage/products/qabuli-1.jpg')
        ->assertJsonPath('data.0.images.0.path', 'products/qabuli-1.jpg')
        ->assertJsonPath('data.0.images.0.url', '/storage/products/qabuli-1.jpg')
        ->assertJsonPath('data.0.images.0.sort_order', 0)
        ->assertJsonPath('data.0.images.1.path', 'products/qabuli-2.jpg')
        ->assertJsonPath('data.0.images.1.sort_order', 1);
});

test('digital tablet menu products endpoint respects category sort order in the main feed', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $lateCategory = ProductCategory::create([
        'name' => 'Late Category',
        'sort_order' => 2,
    ]);

    $earlyCategory = ProductCategory::create([
        'name' => 'Early Category',
        'sort_order' => 1,
    ]);

    ProductType::create([
        'name' => 'food',
        'pashto_name' => 'خواړه',
        'dari_name' => 'غذا',
    ]);

    Product::create([
        'product_category_id' => $lateCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Second In Feed',
        'type' => 'food',
        'base_price' => 200,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $earlyCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'First In Feed',
        'type' => 'food',
        'base_price' => 150,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/digital-tablet-menu/products')
        ->assertOk()
        ->assertJsonPath('data.0.product_category_name', 'Early Category')
        ->assertJsonPath('data.0.name', 'First In Feed')
        ->assertJsonPath('data.1.product_category_name', 'Late Category')
        ->assertJsonPath('data.1.name', 'Second In Feed');
});

test('digital tablet menu categories endpoint is public and only returns categories with active products', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $activeCategory = ProductCategory::create([
        'name' => 'Afghan Food',
        'sort_order' => 2,
        'dari_name' => 'غذا افغانی',
        'pashto_name' => 'افغاني خواړه',
        'image_path' => 'categories/afghan-food.jpg',
    ]);

    $inactiveCategory = ProductCategory::create([
        'name' => 'Hidden Category',
    ]);

    Product::create([
        'product_category_id' => $activeCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Mantu',
        'type' => 'food',
        'base_price' => 250,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $inactiveCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Inactive Dish',
        'type' => 'food',
        'base_price' => 100,
        'is_active' => false,
    ]);

    $this->getJson('/api/v1/digital-tablet-menu/categories')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $activeCategory->id)
        ->assertJsonPath('data.0.name', 'Afghan Food')
        ->assertJsonPath('data.0.products_count', 1)
        ->assertJsonPath('data.0.image_url', '/storage/categories/afghan-food.jpg');
});

test('digital tablet menu categories endpoint respects category sort order', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $pizza = ProductCategory::create(['name' => 'Pizza', 'sort_order' => 1]);
    $kababs = ProductCategory::create(['name' => 'Kababs', 'sort_order' => 2]);
    $afghan = ProductCategory::create([
        'name' => 'Afghan Cuisine',
        'sort_order' => 3,
    ]);

    Product::create([
        'product_category_id' => $afghan->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Mantu',
        'type' => 'food',
        'base_price' => 250,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $pizza->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Pepperoni Pizza',
        'type' => 'food',
        'base_price' => 600,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $kababs->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Chapli Kabab',
        'type' => 'food',
        'base_price' => 250,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/digital-tablet-menu/categories')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Pizza')
        ->assertJsonPath('data.1.name', 'Kababs')
        ->assertJsonPath('data.2.name', 'Afghan Cuisine');
});

test('digital tablet menu category products include items assigned to multiple display categories', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $kababsCategory = ProductCategory::create(['name' => 'Kababs']);
    $afghanCuisineCategory = ProductCategory::create([
        'name' => 'Afghan Cuisine',
        'dari_name' => 'غذا افغانی',
        'pashto_name' => 'افغاني خواړه',
    ]);
    $cuisine = Cuisine::firstOrCreate(['name' => 'Afghan']);

    ProductType::create([
        'name' => 'food',
        'pashto_name' => 'خواړه',
        'dari_name' => 'غذا',
    ]);

    $product = Product::create([
        'product_category_id' => $kababsCategory->id,
        'cuisine_id' => $cuisine->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Chef Kabab',
        'pashto_name' => 'شف کباب',
        'dari_name' => 'شف کباب',
        'type' => 'food',
        'base_price' => 320,
        'is_active' => true,
    ]);

    $product->categories()->syncWithoutDetaching([
        $afghanCuisineCategory->id,
    ]);

    $this->getJson(
        '/api/v1/digital-tablet-menu/categories/'.$kababsCategory->id.'/products',
    )
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $product->id)
        ->assertJsonFragment(['product_category_ids' => [$afghanCuisineCategory->id, $kababsCategory->id]]);

    $this->getJson(
        '/api/v1/digital-tablet-menu/categories/'.$afghanCuisineCategory->id.'/products',
    )
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $product->id)
        ->assertJsonFragment(['name' => 'Afghan Cuisine']);
});

test('digital tablet menu products by category endpoint is public', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $mainCategory = ProductCategory::create(['name' => 'Main']);
    $dessertCategory = ProductCategory::create(['name' => 'Dessert']);

    $kabab = Product::create([
        'product_category_id' => $mainCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Kabab',
        'type' => 'food',
        'base_price' => 320,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $dessertCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Firni',
        'type' => 'dessert',
        'base_price' => 120,
        'is_active' => true,
    ]);

    $this->getJson("/api/v1/digital-tablet-menu/categories/{$mainCategory->id}/products")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $kabab->id)
        ->assertJsonPath('data.0.name', 'Kabab')
        ->assertJsonPath('data.0.category_name', 'Main');
});

test('digital tablet menu cuisines and products by cuisine endpoints are public', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $category = ProductCategory::create(['name' => 'Kababs']);
    $afghanCuisine = Cuisine::firstOrCreate(['name' => 'Afghan']);
    $turkishCuisine = Cuisine::firstOrCreate(['name' => 'Turkish']);

    $chapliKabab = Product::create([
        'product_category_id' => $category->id,
        'cuisine_id' => $afghanCuisine->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Chapli Kabab',
        'type' => 'food',
        'base_price' => 250,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $category->id,
        'cuisine_id' => $turkishCuisine->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Turkish Kabab',
        'type' => 'food',
        'base_price' => 300,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/digital-tablet-menu/cuisines')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Afghan');

    $this->getJson("/api/v1/digital-tablet-menu/cuisines/{$afghanCuisine->id}/products")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $chapliKabab->id)
        ->assertJsonPath('data.0.name', 'Chapli Kabab')
        ->assertJsonPath('data.0.product_category_name', 'Kababs')
        ->assertJsonPath('data.0.cuisine_name', 'Afghan');
});

test('digital tablet menu types endpoint is public and only returns types used by active products', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $foodType = ProductType::create([
        'name' => 'food',
        'dari_name' => 'غذا',
        'pashto_name' => 'خواړه',
        'image_path' => 'types/food.jpg',
    ]);

    ProductType::create([
        'name' => 'dessert',
    ]);

    Product::create([
        'product_category_id' => ProductCategory::create(['name' => 'Meals'])->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Bolani',
        'type' => 'food',
        'base_price' => 180,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/digital-tablet-menu/types')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $foodType->id)
        ->assertJsonPath('data.0.type', 'food')
        ->assertJsonPath('data.0.type_pashto_name', 'خواړه')
        ->assertJsonPath('data.0.type_dari_name', 'غذا')
        ->assertJsonPath('data.0.name', 'food')
        ->assertJsonPath('data.0.products_count', 1)
        ->assertJsonPath('data.0.image_url', '/storage/types/food.jpg');
});

test('digital tablet menu products by type endpoint is public', function () {
    [, $kitchen] = createDigitalTabletMenuBaseData();

    $foodType = ProductType::create([
        'name' => 'food',
        'pashto_name' => 'خواړه',
        'dari_name' => 'غذا',
    ]);
    ProductType::create(['name' => 'drink']);

    $category = ProductCategory::create(['name' => 'Meals']);

    $foodProduct = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Ashak',
        'type' => 'food',
        'base_price' => 280,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Tea',
        'type' => 'drink',
        'base_price' => 40,
        'is_active' => true,
    ]);

    $this->getJson("/api/v1/digital-tablet-menu/types/{$foodType->id}/products")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $foodProduct->id)
        ->assertJsonPath('data.0.name', 'Ashak')
        ->assertJsonPath('data.0.type', 'food')
        ->assertJsonPath('data.0.product_type_id', $foodType->id)
        ->assertJsonPath('data.0.type_pashto_name', 'خواړه')
        ->assertJsonPath('data.0.type_dari_name', 'غذا')
        ->assertJsonPath('data.0.product_type_pashto_name', 'خواړه')
        ->assertJsonPath('data.0.product_type_dari_name', 'غذا');
});
