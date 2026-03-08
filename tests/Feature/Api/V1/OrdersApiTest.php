<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use Carbon\Carbon;

function createOrderApiBaseData(): array
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

test('api v1 orders index returns paginated orders', function () {
    [$branch, $kitchen] = createOrderApiBaseData();
    $user = User::factory()->create();
    $category = ProductCategory::create(['name' => 'Main Dishes']);

    $product = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Kabuli Pulao',
        'type' => 'food',
        'base_price' => 450,
        'is_active' => true,
    ]);

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'order_type' => 'delivery',
        'customer_name' => 'Ahmad',
        'customer_phone' => '0700000000',
        'delivery_address' => 'Shahr-e-Naw',
        'base_currency' => 'AFN',
        'total_amount' => 450,
        'paid_amount' => 450,
        'change_amount' => 0,
        'status' => 'pending',
        'created_at' => Carbon::parse('2026-03-07 11:00:00'),
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_size_id' => null,
        'kitchen_id' => $kitchen->id,
        'quantity' => 1,
        'price' => 450,
    ]);

    $this->getJson('/api/v1/orders?status=pending&type=delivery&category_id='.$category->id)
        ->assertOk()
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $order->id)
        ->assertJsonPath('data.0.status', 'pending')
        ->assertJsonPath('data.0.order_type', 'delivery')
        ->assertJsonPath('data.0.items.0.product_name', 'Kabuli Pulao');
});

test('api v1 orders show returns a single order', function () {
    [$branch, $kitchen] = createOrderApiBaseData();
    $user = User::factory()->create();
    $category = ProductCategory::create(['name' => 'Drinks']);

    $product = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Doogh',
        'type' => 'beverage',
        'base_price' => 80,
        'is_active' => true,
    ]);

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'order_type' => 'takeaway',
        'base_currency' => 'AFN',
        'total_amount' => 160,
        'paid_amount' => 200,
        'change_amount' => 40,
        'status' => 'ready',
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_size_id' => null,
        'kitchen_id' => $kitchen->id,
        'quantity' => 2,
        'price' => 80,
    ]);

    $this->getJson('/api/v1/orders/'.$order->id)
        ->assertOk()
        ->assertJsonPath('data.id', $order->id)
        ->assertJsonPath('data.status', 'ready')
        ->assertJsonPath('data.order_type', 'takeaway')
        ->assertJsonPath('data.items.0.line_total', 160);
});
