<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

function createOrderUpdateBaseData(): array
{
    $country = Country::create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => 'AFN',
        'is_active' => true,
    ]);

    $province = Province::create([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);

    $branch = Branch::create([
        'name' => 'Main Branch',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'is_active' => true,
    ]);

    $kitchen = Kitchen::create([
        'branch_id' => $branch->id,
        'name' => 'Hot Kitchen',
        'is_active' => true,
    ]);

    $category = ProductCategory::create([
        'name' => 'Main Dishes',
    ]);

    return [$branch, $kitchen, $category];
}

test('orders can be edited and items removed with totals recalculated', function () {
    $this->seed(RolePermissionSeeder::class);

    [$branch, $kitchen, $category] = createOrderUpdateBaseData();
    $user = User::factory()->create(['branch_id' => $branch->id]);
    $user->givePermissionTo('orders.update');

    $firstProduct = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Kabuli Pulao',
        'type' => 'food',
        'base_price' => 250,
        'is_active' => true,
    ]);

    $secondProduct = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Mantu',
        'type' => 'food',
        'base_price' => 180,
        'is_active' => true,
    ]);

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'order_type' => 'takeaway',
        'base_currency' => 'AFN',
        'sub_total_amount' => 430,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 430,
        'paid_amount' => 430,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'pending',
    ]);

    $order->items()->createMany([
        [
            'product_id' => $firstProduct->id,
            'product_size_id' => null,
            'kitchen_id' => $kitchen->id,
            'quantity' => 1,
            'price' => 250,
        ],
        [
            'product_id' => $secondProduct->id,
            'product_size_id' => null,
            'kitchen_id' => $kitchen->id,
            'quantity' => 1,
            'price' => 180,
        ],
    ]);

    $this->actingAs($user)
        ->patch(route('orders.update', $order), [
            'branch_id' => $branch->id,
            'order_type' => 'takeaway',
            'payment_method' => 'cash',
            'branch_table_id' => null,
            'customer_name' => null,
            'customer_phone' => null,
            'delivery_address' => null,
            'items' => [
                [
                    'product_id' => $firstProduct->id,
                    'product_size_id' => null,
                    'quantity' => 2,
                    'price' => 250,
                ],
            ],
        ])
        ->assertRedirect(route('orders.index'));

    $order->refresh();

    expect($order->items()->count())->toBe(1);
    expect((int) $order->items()->first()->product_id)->toBe($firstProduct->id);
    expect((int) $order->items()->first()->quantity)->toBe(2);
    expect((float) $order->sub_total_amount)->toBe(500.0);
    expect((float) $order->total_amount)->toBe(500.0);
    expect((float) $order->paid_amount)->toBe(0.0);
    expect($order->payments()->count())->toBe(0);
});
