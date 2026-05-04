<?php

use Database\Seeders\RolePermissionSeeder;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use App\Models\ProductType;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('super-admin');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('dashboard order status overview filters stats by selected date', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('super-admin');

    Carbon::setTestNow('2026-02-26 10:00:00');

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

    DB::table('orders')->insert([
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'order_type' => 'dine_in',
        'base_currency' => 'AFN',
        'total_amount' => 100,
        'paid_amount' => 100,
        'change_amount' => 0,
        'status' => 'ready',
        'created_at' => Carbon::parse('2026-02-25 12:00:00'),
        'updated_at' => Carbon::parse('2026-02-25 12:00:00'),
    ]);

    DB::table('orders')->insert([
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'order_type' => 'dine_in',
        'base_currency' => 'AFN',
        'total_amount' => 120,
        'paid_amount' => 120,
        'change_amount' => 0,
        'status' => 'pending',
        'created_at' => Carbon::parse('2026-02-26 08:00:00'),
        'updated_at' => Carbon::parse('2026-02-26 08:00:00'),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard', ['date' => '2026-02-25']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('data.selectedDate', '2026-02-25')
            ->where('data.orders.ready', 1)
            ->where('data.orders.pending', 0)
            ->where('data.orders.in_progress', 0)
            ->where('data.orders.completed', 0)
            ->where('data.orders.cancelled', 0)
        );

    Carbon::setTestNow();
});

test('dashboard finance snapshot uses live totals for net profit', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('super-admin');

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

    DB::table('orders')->insert([
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'order_type' => 'dine_in',
        'base_currency' => 'AFN',
        'total_amount' => 500,
        'paid_amount' => 500,
        'change_amount' => 0,
        'status' => 'completed',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('data.finance.netProfit', 500)
            ->where('data.finance.expenses', 0)
        );
});

test('dashboard top ordered dishes shows the top 6 all time dishes with names', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('super-admin');

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

    ProductType::create(['name' => 'food']);
    $category = ProductCategory::create(['name' => 'Main Dishes']);

    $products = collect(range(1, 7))->map(function (int $index) use ($category, $kitchen) {
        $product = Product::create([
            'product_category_id' => $category->id,
            'kitchen_id' => $kitchen->id,
            'name' => "Dish {$index}",
            'dari_name' => "غذا {$index}",
            'pashto_name' => "خواړه {$index}",
            'type' => 'food',
            'base_price' => 100 + $index,
            'is_active' => true,
        ]);

        return $product;
    });

    foreach ($products as $index => $product) {
        $order = DB::table('orders')->insertGetId([
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'order_type' => 'dine_in',
            'base_currency' => 'AFN',
            'total_amount' => 100,
            'paid_amount' => 100,
            'change_amount' => 0,
            'status' => 'completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        OrderItem::create([
            'order_id' => $order,
            'product_id' => $product->id,
            'product_name_snapshot' => $product->name,
            'kitchen_id' => $kitchen->id,
            'quantity' => 20 - $index,
            'price' => $product->base_price,
            'line_total' => (20 - $index) * $product->base_price,
        ]);
    }

    Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Drink Hidden',
        'type' => 'beverage',
        'base_price' => 50,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('data.topOrderedDishes', 6)
            ->where('data.topOrderedDishes.0.product_name', 'Dish 1')
            ->where('data.topOrderedDishes.0.total_quantity', 20)
            ->where('data.topOrderedDishes.5.product_name', 'Dish 6')
        );
});
