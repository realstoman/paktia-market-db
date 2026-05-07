<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductSize;
use App\Models\ProductType;
use App\Models\Province;
use function Pest\Laravel\getJson;

function createProductApiBaseData(): array
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

test('api v1 products index returns products with images', function () {
    [, $kitchen] = createProductApiBaseData();
    $category = ProductCategory::create(['name' => 'Main Dishes']);
    ProductType::create(['name' => 'food']);
    $small = ProductSize::create(['name' => 'Small', 'code' => 'S']);
    $large = ProductSize::create(['name' => 'Large', 'code' => 'L']);

    $product = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Kabuli Pulao',
        'type' => 'food',
        'base_price' => 450,
        'is_active' => true,
    ]);

    $product->images()->createMany([
        ['path' => 'products/pulao-1.jpg', 'sort_order' => 0],
        ['path' => 'products/pulao-2.jpg', 'sort_order' => 1],
    ]);
    $product->sizes()->sync([
        $small->id => ['price' => 400],
        $large->id => ['price' => 650],
    ]);

    $this->getJson('/api/v1/products?type=food&category_id='.$category->id)
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $product->id)
        ->assertJsonPath('data.0.images_count', 2)
        ->assertJsonPath('data.0.sizes.0.name', 'Small')
        ->assertJsonPath('data.0.sizes.0.price', 400)
        ->assertJsonPath('data.0.sizes.1.name', 'Large')
        ->assertJsonPath('data.0.sizes.1.price', 650)
        ->assertJsonPath('data.0.images.0.path', 'products/pulao-1.jpg')
        ->assertJsonPath('data.0.images.0.url', '/storage/products/pulao-1.jpg');
});

test('api v1 products show returns a single product', function () {
    [, $kitchen] = createProductApiBaseData();
    $category = ProductCategory::create([
        'name' => 'Drinks',
        'dari_name' => 'نوشیدنی‌ها',
        'pashto_name' => 'څښاکونه',
    ]);
    $medium = ProductSize::create(['name' => 'Medium', 'code' => 'M']);

    $product = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Doogh',
        'type' => 'beverage',
        'base_price' => 80,
        'is_active' => true,
    ]);

    $product->images()->create([
        'path' => 'products/doogh.jpg',
        'sort_order' => 0,
    ]);
    $product->sizes()->sync([
        $medium->id => ['price' => 120],
    ]);

    expect($product->fresh()->load('category')->category?->name)->toBe('Drinks');

    getJson('/api/v1/products/'.$product->id)
        ->assertOk()
        ->assertJsonPath('data.id', $product->id)
        ->assertJsonPath('data.category_name', 'Drinks')
        ->assertJsonPath('data.category_dari_name', 'نوشیدنی‌ها')
        ->assertJsonPath('data.category_pashto_name', 'څښاکونه')
        ->assertJsonPath('data.sizes.0.name', 'Medium')
        ->assertJsonPath('data.sizes.0.code', 'M')
        ->assertJsonPath('data.sizes.0.price', 120)
        ->assertJsonPath('data.images.0.url', '/storage/products/doogh.jpg');
});

test('api v1 product categories index and show work', function () {
    $category = ProductCategory::create([
        'name' => 'Desserts',
        'pashto_name' => 'خواږه',
        'dari_name' => 'شیرینی',
        'description' => 'Sweet items',
        'pashto_description' => 'د خوږو توکو کتګوري',
        'dari_description' => 'دسته‌بندی خوراکی‌های شیرین',
        'image_path' => 'product-categories/desserts-hero.jpg',
    ]);

    $this->getJson('/api/v1/products/categories')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Desserts')
        ->assertJsonPath('data.0.pashto_name', 'خواږه')
        ->assertJsonPath('data.0.dari_name', 'شیرینی')
        ->assertJsonPath('data.0.image_url', '/storage/product-categories/desserts-hero.jpg');

    $this->getJson('/api/v1/products/categories/'.$category->id)
        ->assertOk()
        ->assertJsonPath('data.id', $category->id)
        ->assertJsonPath('data.name', 'Desserts')
        ->assertJsonPath('data.pashto_description', 'د خوږو توکو کتګوري')
        ->assertJsonPath('data.dari_description', 'دسته‌بندی خوراکی‌های شیرین')
        ->assertJsonPath('data.image_path', 'product-categories/desserts-hero.jpg');
});

test('api v1 product types index and show work', function () {
    $type = ProductType::create([
        'name' => 'beverage',
        'pashto_name' => 'څښاک',
        'dari_name' => 'نوشیدنی',
        'description' => 'Drinks and juices',
        'pashto_description' => 'د څښاک کتګوري',
        'dari_description' => 'دسته نوشیدنی‌ها',
        'image_path' => 'product-types/beverage-banner.jpg',
    ]);

    $this->getJson('/api/v1/products/types')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'beverage')
        ->assertJsonPath('data.0.pashto_name', 'څښاک')
        ->assertJsonPath('data.0.dari_name', 'نوشیدنی')
        ->assertJsonPath('data.0.image_url', '/storage/product-types/beverage-banner.jpg');

    $this->getJson('/api/v1/products/types/'.$type->id)
        ->assertOk()
        ->assertJsonPath('data.id', $type->id)
        ->assertJsonPath('data.name', 'beverage')
        ->assertJsonPath('data.pashto_description', 'د څښاک کتګوري')
        ->assertJsonPath('data.dari_description', 'دسته نوشیدنی‌ها')
        ->assertJsonPath('data.image_path', 'product-types/beverage-banner.jpg');
});

test('api v1 category products endpoint returns products for the selected category', function () {
    [, $kitchen] = createProductApiBaseData();
    $mainCategory = ProductCategory::create([
        'name' => 'Main Dishes',
        'dari_name' => 'غذاهای اصلی',
        'pashto_name' => 'اصلي خواړه',
    ]);
    $drinkCategory = ProductCategory::create([
        'name' => 'Drinks',
        'dari_name' => 'نوشیدنی‌ها',
        'pashto_name' => 'څښاکونه',
    ]);
    $family = ProductSize::create(['name' => 'Family', 'code' => 'F']);

    $mainProduct = Product::create([
        'product_category_id' => $mainCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Kabuli Pulao',
        'type' => 'food',
        'base_price' => 450,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $drinkCategory->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Doogh',
        'type' => 'beverage',
        'base_price' => 80,
        'is_active' => true,
    ]);

    $mainProduct->images()->create([
        'path' => 'products/pulao.jpg',
        'sort_order' => 0,
    ]);
    $mainProduct->sizes()->sync([
        $family->id => ['price' => 900],
    ]);

    $this->getJson('/api/v1/products/categories/'.$mainCategory->id.'/products')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $mainProduct->id)
        ->assertJsonPath('data.0.category_name', 'Main Dishes')
        ->assertJsonPath('data.0.category_dari_name', 'غذاهای اصلی')
        ->assertJsonPath('data.0.category_pashto_name', 'اصلي خواړه')
        ->assertJsonPath('data.0.sizes.0.name', 'Family')
        ->assertJsonPath('data.0.sizes.0.price', 900)
        ->assertJsonPath('data.0.images.0.url', '/storage/products/pulao.jpg');
});

test('api v1 type products endpoint returns products for the selected type', function () {
    [, $kitchen] = createProductApiBaseData();
    $category = ProductCategory::create([
        'name' => 'Mixed',
        'dari_name' => 'ترکیبی',
        'pashto_name' => 'ګډ',
    ]);
    $foodType = ProductType::create(['name' => 'food']);
    ProductType::create(['name' => 'beverage']);
    $small = ProductSize::create(['name' => 'Small', 'code' => 'S']);
    $family = ProductSize::create(['name' => 'Family', 'code' => 'F']);

    $foodProduct = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Mantu',
        'type' => $foodType->name,
        'base_price' => 300,
        'is_active' => true,
    ]);

    Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Green Tea',
        'type' => 'beverage',
        'base_price' => 60,
        'is_active' => true,
    ]);

    $foodProduct->images()->create([
        'path' => 'products/mantu.jpg',
        'sort_order' => 0,
    ]);
    $foodProduct->sizes()->sync([
        $small->id => ['price' => 300],
        $family->id => ['price' => 900],
    ]);

    $this->getJson('/api/v1/products/types/'.$foodType->id.'/products')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $foodProduct->id)
        ->assertJsonPath('data.0.type', 'food')
        ->assertJsonPath('data.0.sizes.0.name', 'Small')
        ->assertJsonPath('data.0.sizes.0.price', 300)
        ->assertJsonPath('data.0.sizes.1.name', 'Family')
        ->assertJsonPath('data.0.sizes.1.price', 900)
        ->assertJsonPath('data.0.images.0.url', '/storage/products/mantu.jpg');
});

test('api v1 top ordered dishes endpoint returns only the top 6 dishes with card data', function () {
    [$branch, $kitchen] = createProductApiBaseData();
    $category = ProductCategory::create([
        'name' => 'Afghan Dishes',
        'dari_name' => 'غذاهای افغانی',
        'pashto_name' => 'افغاني خواړه',
    ]);

    $products = collect(range(1, 7))->map(function (int $index) use ($category, $kitchen) {
        $product = Product::create([
            'product_category_id' => $category->id,
            'kitchen_id' => $kitchen->id,
            'name' => "Dish {$index}",
            'type' => 'food',
            'base_price' => 100 + ($index * 10),
            'is_active' => true,
        ]);

        $product->images()->create([
            'path' => "products/dish-{$index}.jpg",
            'sort_order' => 0,
        ]);

        return $product;
    });

    foreach ($products as $index => $product) {
        $order = Order::create([
            'branch_id' => $branch->id,
            'order_type' => 'delivery',
            'base_currency' => 'AFN',
            'sub_total_amount' => 0,
            'status' => 'completed',
            'total_amount' => 0,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 70 - ($index * 10),
            'price' => $product->base_price,
            'line_total' => (70 - ($index * 10)) * $product->base_price,
        ]);
    }

    $cancelledOrder = Order::create([
        'branch_id' => $branch->id,
        'order_type' => 'delivery',
        'base_currency' => 'AFN',
        'sub_total_amount' => 0,
        'status' => 'cancelled',
        'total_amount' => 0,
    ]);

    OrderItem::create([
        'order_id' => $cancelledOrder->id,
        'product_id' => $products->last()->id,
        'quantity' => 999,
        'price' => $products->last()->base_price,
        'line_total' => 999 * $products->last()->base_price,
    ]);

    $response = $this->getJson('/api/v1/products/top-ordered-dishes')
        ->assertOk()
        ->assertJsonCount(6, 'data')
        ->assertJsonPath('data.0.name', 'Dish 1')
        ->assertJsonPath('data.0.image_url', '/storage/products/dish-1.jpg')
        ->assertJsonPath('data.0.price', 110)
        ->assertJsonPath('data.0.link', '/products/dish-1')
        ->assertJsonPath('data.0.api_link', url('/api/v1/products/'.$products->first()->id))
        ->assertJsonPath('data.0.category_name', 'Afghan Dishes')
        ->assertJsonPath('data.0.category_dari_name', 'غذاهای افغانی')
        ->assertJsonPath('data.0.category_pashto_name', 'افغاني خواړه')
        ->assertJsonPath('data.0.total_quantity', 70);

    expect(collect($response->json('data'))->pluck('name')->all())
        ->toBe(['Dish 1', 'Dish 2', 'Dish 3', 'Dish 4', 'Dish 5', 'Dish 6']);
});
