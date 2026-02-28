<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Province;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('dashboard order status overview filters stats by selected date', function () {
    $user = User::factory()->create();

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
