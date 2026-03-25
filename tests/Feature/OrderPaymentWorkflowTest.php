<?php

use App\Models\Branch;
use App\Models\BranchTable;
use App\Models\Country;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

test('server can create an unpaid dine in order and cashier can settle it later', function () {
    $this->seed(RolePermissionSeeder::class);

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
        'country_id' => $country->id,
        'province_id' => $province->id,
        'name' => 'Main Branch',
        'address' => 'Kabul',
        'description' => 'HQ',
        'is_active' => true,
    ]);

    $table = BranchTable::create([
        'branch_id' => $branch->id,
        'table_number' => '5',
        'title' => 'Center 5',
        'is_active' => true,
    ]);

    $category = ProductCategory::create(['name' => 'Main']);

    $product = Product::create([
        'name' => 'Mantu',
        'product_category_id' => $category->id,
        'base_price' => 200,
        'type' => 'food',
        'is_active' => true,
    ]);

    $server = User::factory()->create(['branch_id' => $branch->id]);
    $server->assignRole('server');
    $server->givePermissionTo('orders.create');

    $this->actingAs($server)
        ->post('/orders', [
            'branch_id' => $branch->id,
            'branch_table_id' => $table->id,
            'order_type' => 'dine_in',
            'payment_method' => null,
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_size_id' => null,
                    'quantity' => 2,
                    'price' => 200,
                ],
            ],
        ])
        ->assertRedirect(route('orders.index'));

    $order = \App\Models\Order::query()->latest('id')->first();

    expect((float) $order->paid_amount)->toBe(0.0);
    expect($order->payments()->count())->toBe(0);

    $cashier = User::factory()->create(['branch_id' => $branch->id]);
    $cashier->assignRole('cashier');
    $cashier->givePermissionTo('orders.update');
    $cashier->givePermissionTo('payments.create');

    $this->actingAs($cashier)
        ->patch("/orders/{$order->id}/status", [
            'status' => 'completed',
            'payment_method' => 'cash',
        ])
        ->assertRedirect(route('orders.index'));

    $order->refresh();

    expect((float) $order->paid_amount)->toBe(400.0);
    expect($order->payments()->count())->toBe(1);
    expect((string) $order->payments()->first()->method)->toBe('cash');
});
