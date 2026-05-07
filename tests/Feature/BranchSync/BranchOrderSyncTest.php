<?php

use App\Http\Middleware\EnsureBranchSyncAuthenticated;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Services\BranchSync\BranchSyncCredentialService;

function createBranchSyncOrderBranch(string $name = 'Branch Sync HQ'): Branch
{
    $country = Country::firstOrCreate([
        'name' => 'Afghanistan',
    ], [
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => 'AFN',
        'is_active' => true,
    ]);

    $province = Province::firstOrCreate([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);

    return Branch::create([
        'country_id' => $country->id,
        'province_id' => $province->id,
        'name' => $name,
        'address' => 'Kabul',
        'description' => 'For branch sync order tests',
        'is_active' => true,
    ]);
}

function createBranchSyncProduct(Branch $branch): Product
{
    $kitchen = Kitchen::create([
        'branch_id' => $branch->id,
        'name' => 'Kababs Kitchen',
        'is_active' => true,
    ]);

    $category = ProductCategory::create([
        'name' => 'Main Dishes',
    ]);

    return Product::create([
        'name' => 'Chapli Kabab',
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'type' => 'food',
        'base_price' => 250,
        'is_active' => true,
    ]);
}

test('branch sync inbound orders endpoint only returns branch online orders', function () {
    $branch = createBranchSyncOrderBranch('Downtown Branch');
    $otherBranch = createBranchSyncOrderBranch('Airport Branch');
    $product = createBranchSyncProduct($branch);
    createBranchSyncProduct($otherBranch);

    $mobileOrder = Order::create([
        'sync_uuid' => '11111111-1111-1111-1111-111111111111',
        'branch_id' => $branch->id,
        'order_type' => 'delivery',
        'source' => 'mobile_app',
        'sync_origin' => 'remote',
        'customer_name' => 'Client One',
        'customer_phone' => '0700000001',
        'delivery_address' => 'Shahr-e-Naw',
        'base_currency' => 'AFN',
        'sub_total_amount' => 250,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 250,
        'paid_amount' => 0,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'pending',
    ]);
    $mobileOrder->items()->create([
        'product_id' => $product->id,
        'product_name_snapshot' => $product->name,
        'kitchen_id' => $product->kitchen_id,
        'prep_status' => 'pending',
        'quantity' => 1,
        'price' => 250,
        'line_total' => 250,
    ]);

    Order::create([
        'sync_uuid' => '22222222-2222-2222-2222-222222222222',
        'branch_id' => $branch->id,
        'order_type' => 'takeaway',
        'source' => 'pos',
        'sync_origin' => 'local',
        'base_currency' => 'AFN',
        'sub_total_amount' => 250,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 250,
        'paid_amount' => 0,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'pending',
    ]);

    Order::create([
        'sync_uuid' => '33333333-3333-3333-3333-333333333333',
        'branch_id' => $otherBranch->id,
        'order_type' => 'delivery',
        'source' => 'website',
        'sync_origin' => 'remote',
        'customer_name' => 'Client Two',
        'customer_phone' => '0700000002',
        'delivery_address' => 'Airport Road',
        'base_currency' => 'AFN',
        'sub_total_amount' => 250,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 250,
        'paid_amount' => 0,
        'change_amount' => 0,
        'refund_amount' => 0,
        'status' => 'pending',
    ]);

    $issued = app(BranchSyncCredentialService::class)->issue($branch, 'branch-server', ['orders.pull']);

    $this->withHeaders([
        EnsureBranchSyncAuthenticated::TOKEN_HEADER => $issued['plain_text_token'],
    ])->getJson('/api/v1/branch-sync/orders/inbound')
        ->assertOk()
        ->assertJsonPath('meta.branch_id', $branch->id)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.sync_uuid', '11111111-1111-1111-1111-111111111111')
        ->assertJsonPath('data.0.source', 'mobile_app');
});

test('branch sync outbound orders endpoint imports and updates orders by sync uuid', function () {
    $branch = createBranchSyncOrderBranch('Central Branch');
    $product = createBranchSyncProduct($branch);
    $issued = app(BranchSyncCredentialService::class)->issue($branch, 'branch-server', ['orders.push']);

    $payload = [
        'orders' => [
            [
                'sync_uuid' => '44444444-4444-4444-4444-444444444444',
                'order_type' => 'takeaway',
                'source' => 'pos',
                'status' => 'pending',
                'customer_name' => 'Walk In',
                'customer_phone' => '0700000004',
                'delivery_address' => null,
                'customer_note' => null,
                'base_currency' => 'AFN',
                'sub_total_amount' => 500,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'service_charge_amount' => 0,
                'total_amount' => 500,
                'paid_amount' => 0,
                'change_amount' => 0,
                'refund_amount' => 0,
                'created_at' => now()->subMinutes(5)->toIso8601String(),
                'updated_at' => now()->subMinutes(5)->toIso8601String(),
                'items' => [
                    [
                        'product_id' => $product->id,
                        'product_size_id' => null,
                        'quantity' => 2,
                        'price' => 250,
                        'note' => 'Less spicy',
                    ],
                ],
            ],
        ],
    ];

    $this->withHeaders([
        EnsureBranchSyncAuthenticated::TOKEN_HEADER => $issued['plain_text_token'],
    ])->postJson('/api/v1/branch-sync/orders/outbound', $payload)
        ->assertOk()
        ->assertJsonPath('meta.branch_id', $branch->id)
        ->assertJsonPath('meta.imported_count', 1)
        ->assertJsonPath('meta.skipped_count', 0);

    $order = Order::query()->where('sync_uuid', '44444444-4444-4444-4444-444444444444')->firstOrFail();
    expect($order->branch_id)->toBe($branch->id);
    expect($order->items()->count())->toBe(1);
    expect((int) $order->items()->firstOrFail()->quantity)->toBe(2);

    $updatePayload = [
        'orders' => [
            [
                ...$payload['orders'][0],
                'status' => 'ready',
                'updated_at' => now()->toIso8601String(),
                'items' => [
                    [
                        'product_id' => $product->id,
                        'product_size_id' => null,
                        'quantity' => 3,
                        'price' => 250,
                        'note' => 'Less spicy',
                    ],
                ],
            ],
        ],
    ];

    $this->withHeaders([
        EnsureBranchSyncAuthenticated::TOKEN_HEADER => $issued['plain_text_token'],
    ])->postJson('/api/v1/branch-sync/orders/outbound', $updatePayload)
        ->assertOk()
        ->assertJsonPath('meta.imported_count', 1);

    $order->refresh();
    expect((string) ($order->status->value ?? $order->status))->toBe('ready');
    expect((int) $order->items()->sum('quantity'))->toBe(3);
});
