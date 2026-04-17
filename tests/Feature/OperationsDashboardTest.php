<?php

use App\Models\Branch;
use App\Models\BranchTable;
use App\Models\Country;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('cashier sees operations dashboard instead of analytics dashboard', function () {
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

    $user = User::factory()->create(['branch_id' => $branch->id]);
    $user->assignRole('cashier');

    $table = BranchTable::create([
        'branch_id' => $branch->id,
        'table_number' => '1',
        'title' => 'Window',
        'is_active' => true,
    ]);

    $category = ProductCategory::create(['name' => 'Main']);

    Product::create([
        'name' => 'Kabuli Palaw',
        'product_category_id' => $category->id,
        'base_price' => 350,
        'is_active' => true,
    ]);

    Order::create([
        'branch_id' => $branch->id,
        'branch_table_id' => $table->id,
        'user_id' => $user->id,
        'order_type' => 'dine_in',
        'base_currency' => 'AFN',
        'sub_total_amount' => 350,
        'total_amount' => 350,
        'paid_amount' => 0,
        'change_amount' => 0,
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('operations/index')
            ->where('mode', 'cashier')
            ->has('tables', 1)
            ->has('openOrders', 1)
        );
});

test('operations dashboard includes active products without a kitchen assignment', function () {
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

    $user = User::factory()->create(['branch_id' => $branch->id]);
    $user->assignRole('cashier');

    $category = ProductCategory::create(['name' => 'Drinks']);

    $drink = Product::create([
        'name' => 'Cola',
        'product_category_id' => $category->id,
        'base_price' => 60,
        'is_active' => true,
        'kitchen_id' => null,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('operations/index')
            ->where('products.0.id', $drink->id)
        );
});
