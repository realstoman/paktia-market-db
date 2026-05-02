<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Customer;
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
});
