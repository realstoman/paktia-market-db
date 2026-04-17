<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('order takers only see their own orders on the orders page', function () {
    $this->seed(RolePermissionSeeder::class);

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

    $orderTaker = User::factory()->create(['branch_id' => $branch->id]);
    $orderTaker->assignRole('order-taker');

    $otherOrderTaker = User::factory()->create(['branch_id' => $branch->id]);
    $otherOrderTaker->assignRole('order-taker');

    $ownOrder = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $orderTaker->id,
        'order_type' => 'takeaway',
        'base_currency' => 'AFN',
        'sub_total_amount' => 100,
        'total_amount' => 100,
        'paid_amount' => 0,
        'change_amount' => 0,
        'status' => 'pending',
    ]);

    Order::create([
        'branch_id' => $branch->id,
        'user_id' => $otherOrderTaker->id,
        'order_type' => 'delivery',
        'base_currency' => 'AFN',
        'sub_total_amount' => 200,
        'total_amount' => 200,
        'paid_amount' => 0,
        'change_amount' => 0,
        'status' => 'pending',
    ]);

    $this->actingAs($orderTaker)
        ->get(route('orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/index')
            ->has('orders', 1)
            ->where('orders.0.id', $ownOrder->id)
        );
});

test('kitchen users are redirected away from the shared orders page', function () {
    $this->seed(RolePermissionSeeder::class);

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

    $kitchenUser = User::factory()->create([
        'branch_id' => $branch->id,
        'kitchen_id' => $kitchen->id,
    ]);
    $kitchenUser->assignRole('kitchen');

    $this->actingAs($kitchenUser)
        ->get(route('orders.index'))
        ->assertRedirect(route('dashboard'));
});
