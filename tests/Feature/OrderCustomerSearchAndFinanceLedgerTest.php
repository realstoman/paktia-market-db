<?php

use App\Models\Branch;
use App\Models\Client;
use App\Models\Country;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

function createBranchForCustomerSearchAndLedger(): Branch
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

    return Branch::create([
        'country_id' => $country->id,
        'province_id' => $province->id,
        'name' => 'Main Branch',
        'address' => 'Kabul',
        'description' => 'HQ',
        'is_active' => true,
    ]);
}

test('orders customer search matches by customer name or phone', function () {
    $this->seed(RolePermissionSeeder::class);

    $branch = createBranchForCustomerSearchAndLedger();

    $user = User::factory()->create(['branch_id' => $branch->id]);
    $user->assignRole('order-taker');

    $customerByName = Customer::create([
        'name' => 'Ahmad Khan',
        'phone' => '0700111222',
        'is_active' => true,
    ]);

    $customerByPhone = Customer::create([
        'name' => 'Sadia',
        'phone' => '0799888777',
        'is_active' => true,
    ]);

    $client = Client::create([
        'firebase_uid' => 'firebase-client-001',
        'name' => 'Stoman',
        'phone' => '0700123456',
        'email' => 'stoman@email.com',
        'provider' => 'google',
        'is_active' => true,
    ]);

    Customer::create([
        'name' => 'Unrelated Customer',
        'phone' => '0788000000',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->getJson(route('orders.customers.search', ['search' => 'Ahmad']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $customerByName->id);

    $this->actingAs($user)
        ->getJson(route('orders.customers.search', ['search' => '9988']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $customerByPhone->id);

    $this->actingAs($user)
        ->getJson(route('orders.customers.search', ['search' => 'Stoman']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $client->id)
        ->assertJsonPath('data.0.record_type', 'client')
        ->assertJsonPath('data.0.selection_value', 'client:'.$client->id);
});

test('creating a pos order for a registered client links the order to that client', function () {
    $this->seed(RolePermissionSeeder::class);

    $branch = createBranchForCustomerSearchAndLedger();

    $user = User::factory()->create(['branch_id' => $branch->id]);
    $user->assignRole('order-taker');

    $client = Client::create([
        'firebase_uid' => 'firebase-client-002',
        'name' => 'Stoman',
        'phone' => '0700123456',
        'email' => 'stoman@email.com',
        'provider' => 'google',
        'is_active' => true,
    ]);

    $category = ProductCategory::create([
        'name' => 'Kababs',
        'is_active' => true,
    ]);

    $product = Product::create([
        'name' => 'Chapli Kabab',
        'product_category_id' => $category->id,
        'type' => 'food',
        'base_price' => 300,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->post('/orders', [
            'branch_id' => $branch->id,
            'order_type' => 'takeaway',
            'client_id' => $client->id,
            'customer_name' => 'Stoman',
            'customer_phone' => '0700123456',
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_size_id' => null,
                    'quantity' => 1,
                    'price' => 300,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('orders', [
        'branch_id' => $branch->id,
        'client_id' => $client->id,
        'customer_name' => 'Stoman',
        'customer_phone' => '0700123456',
        'source' => 'pos',
    ]);
});
