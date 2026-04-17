<?php

use App\Enums\OrderItemPrepStatus;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use App\Services\Order\OrderService;
use Database\Seeders\RolePermissionSeeder;

function createOrderOwnershipKitchenData(): array
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
        'country_id' => $country->id,
        'province_id' => $province->id,
        'name' => 'Main Branch',
        'address' => 'Kabul',
        'description' => 'HQ',
        'is_active' => true,
    ]);

    $kitchen = Kitchen::create([
        'branch_id' => $branch->id,
        'name' => 'Afghan Foods Kitchen',
        'is_active' => true,
    ]);

    $category = ProductCategory::create([
        'name' => 'Afghan Foods',
    ]);

    $product = Product::create([
        'name' => 'Kabuli Pulao',
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'type' => 'food',
        'base_price' => 450,
        'is_active' => true,
    ]);

    return [$branch, $kitchen, $product];
}

test('order updates preserve already prepared kitchen items and add new quantity as pending', function () {
    $this->seed(RolePermissionSeeder::class);

    [$branch, $kitchen, $product] = createOrderOwnershipKitchenData();

    $orderTaker = User::factory()->create(['branch_id' => $branch->id]);
    $orderTaker->assignRole('order-taker');

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $orderTaker->id,
        'order_type' => 'takeaway',
        'base_currency' => 'AFN',
        'sub_total_amount' => 450,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 450,
        'paid_amount' => 0,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'ready',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name_snapshot' => $product->name,
        'kitchen_id' => $kitchen->id,
        'prep_status' => OrderItemPrepStatus::READY->value,
        'quantity' => 1,
        'price' => 450,
        'line_total' => 450,
        'ready_at' => now(),
    ]);

    app(OrderService::class)->updateOrder($order, [
        'branch_id' => $branch->id,
        'branch_table_id' => null,
        'order_type' => 'takeaway',
        'customer_name' => null,
        'customer_phone' => null,
        'delivery_address' => null,
        'items' => [
            [
                'product_id' => $product->id,
                'product_size_id' => null,
                'quantity' => 2,
                'price' => 450,
            ],
        ],
    ], $orderTaker);

    $order->refresh();
    $items = $order->items()->orderBy('id')->get();

    expect($items)->toHaveCount(2);
    expect((string) ($items[0]->prep_status->value ?? $items[0]->prep_status))
        ->toBe(OrderItemPrepStatus::READY->value);
    expect((int) $items[0]->quantity)->toBe(1);
    expect((string) ($items[1]->prep_status->value ?? $items[1]->prep_status))
        ->toBe(OrderItemPrepStatus::PENDING->value);
    expect((int) $items[1]->quantity)->toBe(1);
});

test('non cashiers can only manage orders they created', function () {
    $this->seed(RolePermissionSeeder::class);

    [$branch] = createOrderOwnershipKitchenData();

    $owner = User::factory()->create(['branch_id' => $branch->id]);
    $owner->assignRole('order-taker');

    $otherOrderTaker = User::factory()->create(['branch_id' => $branch->id]);
    $otherOrderTaker->assignRole('order-taker');

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $owner->id,
        'order_type' => 'takeaway',
        'base_currency' => 'AFN',
        'sub_total_amount' => 450,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 450,
        'paid_amount' => 0,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'pending',
    ]);

    $this->actingAs($otherOrderTaker)
        ->patch("/orders/{$order->id}/status", [
            'status' => 'ready',
        ])
        ->assertSessionHasErrors('order');
});
