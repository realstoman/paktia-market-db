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
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

function createKitchenWorkflowBaseData(): array
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
        'is_active' => true,
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

test('kitchen users see only their kitchen queue on the dashboard', function () {
    $this->seed(RolePermissionSeeder::class);

    [$branch, $kitchen, $product] = createKitchenWorkflowBaseData();

    $otherKitchen = Kitchen::create([
        'branch_id' => $branch->id,
        'name' => 'Grill Kitchen',
        'is_active' => true,
    ]);

    $kitchenUser = User::factory()->create([
        'branch_id' => $branch->id,
        'kitchen_id' => $kitchen->id,
    ]);
    $kitchenUser->assignRole('kitchen');

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $kitchenUser->id,
        'order_type' => 'dine_in',
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

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name_snapshot' => $product->name,
        'kitchen_id' => $kitchen->id,
        'prep_status' => OrderItemPrepStatus::PENDING->value,
        'quantity' => 2,
        'price' => 450,
        'line_total' => 900,
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name_snapshot' => 'Other Kitchen Item',
        'kitchen_id' => $otherKitchen->id,
        'prep_status' => OrderItemPrepStatus::PENDING->value,
        'quantity' => 1,
        'price' => 250,
        'line_total' => 250,
    ]);

    $this->actingAs($kitchenUser)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('operations/index')
            ->where('mode', 'kitchen')
            ->where('kitchenId', $kitchen->id)
            ->has('kitchenQueue', 1)
            ->where('kitchenQueue.0.order_id', $order->id)
            ->has('kitchenQueue.0.items', 1)
        );
});

test('kitchen users can mark their item ready and push the order to ready when all kitchen items are done', function () {
    $this->seed(RolePermissionSeeder::class);

    [$branch, $kitchen, $product] = createKitchenWorkflowBaseData();

    $kitchenUser = User::factory()->create([
        'branch_id' => $branch->id,
        'kitchen_id' => $kitchen->id,
    ]);
    $kitchenUser->assignRole('kitchen');

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $kitchenUser->id,
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

    $item = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name_snapshot' => $product->name,
        'kitchen_id' => $kitchen->id,
        'prep_status' => OrderItemPrepStatus::PENDING->value,
        'quantity' => 1,
        'price' => 450,
        'line_total' => 450,
    ]);

    $this->actingAs($kitchenUser)
        ->post(route('kitchen.order-items.ready', $item))
        ->assertRedirect();

    $item->refresh();
    $order->refresh();

    expect((string) ($item->prep_status->value ?? $item->prep_status))->toBe(OrderItemPrepStatus::READY->value);
    expect($item->prepared_by)->toBe($kitchenUser->id);
    expect($item->ready_at)->not->toBeNull();
    expect((string) ($order->status->value ?? $order->status))->toBe('ready');
});
