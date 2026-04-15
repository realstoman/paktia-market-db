<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Order;
use App\Models\Province;
use App\Models\User;
use App\Services\Order\OrderService;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;

function createBranchForOrders(): Branch
{
    $country = Country::create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => 'AFN',
    ]);

    $province = Province::create([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);

    return Branch::create([
        'country_id' => $country->id,
        'province_id' => $province->id,
        'name' => 'Kabul Central',
        'address' => 'Darulaman Road',
        'description' => 'Test branch',
    ]);
}

test('non super admins cannot change the status of completed orders', function () {
    $service = app(OrderService::class);
    $branch = createBranchForOrders();
    $cashier = User::factory()->create([
        'branch_id' => $branch->id,
    ]);

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $cashier->id,
        'order_type' => 'dine_in',
        'base_currency' => 'AFN',
        'sub_total_amount' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 1000,
        'paid_amount' => 1000,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'completed',
        'completed_at' => now(),
    ]);

    expect(fn () => $service->updateStatus($order, 'ready', null, null, $cashier))
        ->toThrow(ValidationException::class);
});

test('completing payment applies discount and stores the final paid amount', function () {
    $service = app(OrderService::class);
    $branch = createBranchForOrders();
    Permission::findOrCreate('payments.create', 'web');
    $cashier = User::factory()->create([
        'branch_id' => $branch->id,
    ]);
    $cashier->givePermissionTo('payments.create');

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $cashier->id,
        'order_type' => 'dine_in',
        'base_currency' => 'AFN',
        'sub_total_amount' => 1500,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 1500,
        'paid_amount' => 0,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'ready',
    ]);

    $service->updateStatus($order, 'completed', 'cash', 200, $cashier);

    $order->refresh();
    $payment = $order->payments()->first();

    expect((string) $order->status->value)->toBe('completed');
    expect((float) $order->discount_amount)->toBe(200.0);
    expect((float) $order->total_amount)->toBe(1300.0);
    expect((float) $order->paid_amount)->toBe(1300.0);
    expect($payment)->not->toBeNull();
    expect((float) $payment->amount)->toBe(1300.0);
    expect($payment->method)->toBe('cash');
    expect($payment->received_by)->toBe($cashier->id);
});

test('order takers can not complete orders directly without payment permission', function () {
    $service = app(OrderService::class);
    $branch = createBranchForOrders();
    $orderTaker = User::factory()->create([
        'branch_id' => $branch->id,
    ]);

    $order = Order::create([
        'branch_id' => $branch->id,
        'user_id' => $orderTaker->id,
        'order_type' => 'takeaway',
        'base_currency' => 'AFN',
        'sub_total_amount' => 900,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 900,
        'paid_amount' => 0,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'ready',
    ]);

    expect(fn () => $service->updateStatus($order, 'completed', 'cash', null, $orderTaker))
        ->toThrow(ValidationException::class);
});
