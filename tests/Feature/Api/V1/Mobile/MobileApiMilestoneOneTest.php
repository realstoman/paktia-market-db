<?php

use App\Models\Branch;
use App\Models\Cart;
use App\Models\Client;
use App\Models\Country;
use App\Models\GuestSession;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductSize;
use App\Models\Province;

beforeEach(function () {
    config()->set('mobile.apps', [
        [
            'key' => 'test-mobile-key',
            'platform' => 'ios',
            'active' => true,
        ],
    ]);

    config()->set('mobile.firebase.stub_mode', true);
});

function mobileHeaders(array $headers = []): array
{
    return array_merge([
        'X-App-Key' => 'test-mobile-key',
        'X-App-Platform' => 'ios',
    ], $headers);
}

function createMobileProductFixture(): array
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

    $category = ProductCategory::create([
        'name' => 'Pizza',
    ]);

    $small = ProductSize::create([
        'name' => 'Small',
        'code' => 'S',
    ]);

    $product = Product::create([
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'name' => 'Pepperoni Pizza',
        'type' => 'food',
        'base_price' => 500,
        'is_active' => true,
    ]);

    $product->sizes()->sync([
        $small->id => ['price' => 650],
    ]);

    return [$branch, $product, $small];
}

test('mobile products endpoint is temporarily public for catalog testing', function () {
    $this->getJson('/api/v1/products')
        ->assertOk();

    $this->getJson('/api/v1/products', mobileHeaders())->assertOk();
});

test('mobile top ordered dishes endpoint is temporarily public and returns card fields', function () {
    [$branch, $product] = createMobileProductFixture();

    $order = Order::create([
        'branch_id' => $branch->id,
        'order_type' => 'delivery',
        'base_currency' => 'AFN',
        'sub_total_amount' => 0,
        'status' => 'completed',
        'total_amount' => 0,
    ]);

    $product->images()->create([
        'path' => 'products/pepperoni.jpg',
        'sort_order' => 0,
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'quantity' => 5,
        'price' => $product->base_price,
        'line_total' => 5 * $product->base_price,
    ]);

    $this->getJson('/api/v1/products/top-ordered-dishes')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Pepperoni Pizza')
        ->assertJsonPath('data.0.image_url', '/storage/products/pepperoni.jpg')
        ->assertJsonPath('data.0.price', 500)
        ->assertJsonPath('data.0.link', '/products/pepperoni-pizza');

    $this->getJson('/api/v1/products/top-ordered-dishes', mobileHeaders())
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Pepperoni Pizza')
        ->assertJsonPath('data.0.image_url', '/storage/products/pepperoni.jpg')
        ->assertJsonPath('data.0.price', 500)
        ->assertJsonPath('data.0.link', '/products/pepperoni-pizza');
});

test('guest session endpoint creates a guest session token', function () {
    $this->postJson('/api/v1/guest/session', [
        'device_id' => 'device-001',
        'platform' => 'ios',
        'app_version' => '1.0.0',
    ], mobileHeaders())->assertCreated()
        ->assertJsonPath('data.guest_session.platform', 'ios')
        ->assertJsonPath('data.guest_session.device_id', 'device-001');

    expect(GuestSession::count())->toBe(1);
    expect(GuestSession::first()->token)->toStartWith('guest_');
});

test('firebase sync creates or updates a local client record', function () {
    $guestSession = GuestSession::create([
        'token' => 'guest_existing_token',
        'platform' => 'ios',
        'device_id' => 'device-001',
        'expires_at' => now()->addDay(),
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/auth/firebase/sync', [
        'provider' => 'google',
        'name' => 'Ahmad Khan',
        'email' => 'ahmad@example.com',
        'phone' => '+93700111222',
        'avatar_url' => 'https://example.com/avatar.jpg',
    ], mobileHeaders([
        'X-Guest-Token' => $guestSession->token,
        'Authorization' => 'Bearer stub:firebase-user-123',
    ]))->assertOk()
        ->assertJsonPath('data.client.firebase_uid', 'firebase-user-123')
        ->assertJsonPath('data.client.name', 'Ahmad Khan')
        ->assertJsonPath('data.client.email', 'ahmad@example.com')
        ->assertJsonPath('data.guest_session.id', $guestSession->id)
        ->assertJsonPath('data.guest_session.merge_pending', false)
        ->assertJsonPath('data.cart.owner_type', 'client');

    expect(Client::where('firebase_uid', 'firebase-user-123')->exists())->toBeTrue();
    expect($guestSession->fresh()->is_active)->toBeFalse();
    expect($response->json('data.cart.items'))->toBeArray();
});

test('guest can fetch an active cart, add items, update items, and remove items', function () {
    [, $product, $small] = createMobileProductFixture();

    $guestSessionResponse = $this->postJson('/api/v1/guest/session', [
        'device_id' => 'device-002',
        'platform' => 'ios',
    ], mobileHeaders())->assertCreated();

    $guestToken = $guestSessionResponse->json('data.guest_token');

    $this->getJson('/api/v1/cart', mobileHeaders([
        'X-Guest-Token' => $guestToken,
    ]))->assertOk()
        ->assertJsonPath('data.owner_type', 'guest')
        ->assertJsonCount(0, 'data.items');

    $addResponse = $this->postJson('/api/v1/cart/items', [
        'product_id' => $product->id,
        'product_size_id' => $small->id,
        'quantity' => 2,
        'note' => 'Extra cheese',
    ], mobileHeaders([
        'X-Guest-Token' => $guestToken,
    ]))->assertOk()
        ->assertJsonPath('data.items.0.product_name', 'Pepperoni Pizza')
        ->assertJsonPath('data.items.0.size_name', 'Small')
        ->assertJsonPath('data.items.0.quantity', 2)
        ->assertJsonPath('data.items.0.unit_price', 650)
        ->assertJsonPath('data.totals.total', 1300);

    $cartItemId = $addResponse->json('data.items.0.id');

    $this->patchJson("/api/v1/cart/items/{$cartItemId}", [
        'quantity' => 3,
        'note' => 'No olives',
    ], mobileHeaders([
        'X-Guest-Token' => $guestToken,
    ]))->assertOk()
        ->assertJsonPath('data.items.0.quantity', 3)
        ->assertJsonPath('data.items.0.note', 'No olives')
        ->assertJsonPath('data.totals.total', 1950);

    $this->deleteJson("/api/v1/cart/items/{$cartItemId}", [], mobileHeaders([
        'X-Guest-Token' => $guestToken,
    ]))->assertOk()
        ->assertJsonCount(0, 'data.items')
        ->assertJsonPath('data.totals.total', 0);
});

test('firebase sync merges guest cart into the client cart', function () {
    [, $product, $small] = createMobileProductFixture();

    $guestSession = GuestSession::create([
        'token' => 'guest_merge_token',
        'platform' => 'ios',
        'device_id' => 'device-merge',
        'expires_at' => now()->addDay(),
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/cart/items', [
        'product_id' => $product->id,
        'product_size_id' => $small->id,
        'quantity' => 2,
        'note' => 'Extra sauce',
    ], mobileHeaders([
        'X-Guest-Token' => $guestSession->token,
    ]))->assertOk();

    $this->postJson('/api/v1/auth/firebase/sync', [
        'provider' => 'google',
        'name' => 'Merge User',
        'email' => 'merge@example.com',
    ], mobileHeaders([
        'X-Guest-Token' => $guestSession->token,
        'Authorization' => 'Bearer stub:merge-user-001',
    ]))->assertOk()
        ->assertJsonPath('data.client.firebase_uid', 'merge-user-001')
        ->assertJsonPath('data.cart.owner_type', 'client')
        ->assertJsonPath('data.cart.items.0.quantity', 2)
        ->assertJsonPath('data.cart.items.0.product_id', $product->id)
        ->assertJsonPath('data.cart.items.0.product_size_id', $small->id)
        ->assertJsonPath('data.cart.totals.total', 1300);

    expect(Client::where('firebase_uid', 'merge-user-001')->exists())->toBeTrue();
    expect($guestSession->fresh()->merged_at)->not->toBeNull();
});

test('authenticated client can checkout a cart into a mobile order', function () {
    [$branch, $product, $small] = createMobileProductFixture();

    $client = Client::create([
        'firebase_uid' => 'checkout-user-001',
        'name' => 'Checkout User',
        'email' => 'checkout@example.com',
        'phone' => '+93700999888',
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/cart/items', [
        'product_id' => $product->id,
        'product_size_id' => $small->id,
        'quantity' => 2,
        'note' => 'Less spicy',
    ], mobileHeaders([
        'Authorization' => 'Bearer stub:checkout-user-001',
    ]))->assertOk()
        ->assertJsonPath('data.totals.total', 1300);

    $response = $this->postJson('/api/v1/checkout', [
        'branch_id' => $branch->id,
        'order_type' => 'takeaway',
        'customer_note' => 'Please call my name',
    ], mobileHeaders([
        'Authorization' => 'Bearer stub:checkout-user-001',
    ]))->assertCreated()
        ->assertJsonPath('data.client_id', $client->id)
        ->assertJsonPath('data.source', 'mobile_app')
        ->assertJsonPath('data.order_type', 'takeaway')
        ->assertJsonPath('data.customer_name', 'Checkout User')
        ->assertJsonPath('data.customer_phone', '+93700999888')
        ->assertJsonPath('data.customer_note', 'Please call my name')
        ->assertJsonPath('data.items_count', 1)
        ->assertJsonPath('data.items.0.product_name', 'Pepperoni Pizza')
        ->assertJsonPath('data.items.0.product_size_name', 'Small')
        ->assertJsonPath('data.items.0.line_total', 1300)
        ->assertJsonPath('data.items.0.note', 'Less spicy');

    $orderId = $response->json('data.id');

    expect(Order::whereKey($orderId)->where('client_id', $client->id)->where('source', 'mobile_app')->exists())->toBeTrue();
    expect(Cart::where('client_id', $client->id)->where('status', 'checked_out')->exists())->toBeTrue();
});

test('authenticated client can view only their own order history', function () {
    [$branch, $product, $small] = createMobileProductFixture();

    $client = Client::create([
        'firebase_uid' => 'history-user-001',
        'name' => 'History User',
        'email' => 'history@example.com',
        'is_active' => true,
    ]);

    $otherClient = Client::create([
        'firebase_uid' => 'history-user-002',
        'name' => 'Other User',
        'email' => 'other@example.com',
        'is_active' => true,
    ]);

    $ownOrder = Order::create([
        'branch_id' => $branch->id,
        'client_id' => $client->id,
        'order_type' => 'takeaway',
        'source' => 'mobile_app',
        'customer_name' => $client->name,
        'base_currency' => 'AFN',
        'total_amount' => 650,
        'paid_amount' => 0,
        'change_amount' => 0,
        'sub_total_amount' => 650,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'refund_amount' => 0,
        'status' => 'pending',
    ]);

    $ownOrder->items()->create([
        'product_id' => $product->id,
        'product_name_snapshot' => $product->name,
        'product_size_id' => $small->id,
        'product_size_name_snapshot' => $small->name,
        'kitchen_id' => $product->kitchen_id,
        'quantity' => 1,
        'price' => 650,
        'line_total' => 650,
    ]);

    Order::create([
        'branch_id' => $branch->id,
        'client_id' => $otherClient->id,
        'order_type' => 'takeaway',
        'source' => 'mobile_app',
        'customer_name' => $otherClient->name,
        'base_currency' => 'AFN',
        'total_amount' => 650,
        'paid_amount' => 0,
        'change_amount' => 0,
        'sub_total_amount' => 650,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'refund_amount' => 0,
        'status' => 'pending',
    ]);

    $this->getJson('/api/v1/me/orders', mobileHeaders([
        'Authorization' => 'Bearer stub:history-user-001',
    ]))->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $ownOrder->id)
        ->assertJsonPath('data.0.client_id', $client->id)
        ->assertJsonPath('data.0.source', 'mobile_app');

    $this->getJson("/api/v1/me/orders/{$ownOrder->id}", mobileHeaders([
        'Authorization' => 'Bearer stub:history-user-001',
    ]))->assertOk()
        ->assertJsonPath('data.id', $ownOrder->id)
        ->assertJsonPath('data.items.0.product_name', 'Pepperoni Pizza')
        ->assertJsonPath('data.items.0.product_size_name', 'Small')
        ->assertJsonPath('data.items.0.line_total', 650);

    $ownOrder->update([
        'status' => 'ready',
    ]);

    $this->getJson("/api/v1/me/orders/{$ownOrder->id}/status", mobileHeaders([
        'Authorization' => 'Bearer stub:history-user-001',
    ]))->assertOk()
        ->assertJsonPath('data.id', $ownOrder->id)
        ->assertJsonPath('data.status', 'ready')
        ->assertJsonPath('data.source', 'mobile_app');
});

test('web customer firebase login stores the client and returns a customer cookie', function () {
    $response = $this->postJson('/api/v1/customer/auth/firebase/login', [
        'name' => 'Web Customer',
        'email' => 'web@example.com',
        'phone' => '+93700123456',
        'provider' => 'google',
        'avatar_url' => 'https://example.com/web-avatar.jpg',
        'idToken' => 'stub:web-customer-001',
    ])->assertOk()
        ->assertJsonPath('customer.firebase_uid', 'web-customer-001')
        ->assertJsonPath('customer.name', 'Web Customer')
        ->assertJsonPath('customer.email', 'web@example.com')
        ->assertJsonPath('customer.phone', '+93700123456');

    expect(Client::where('firebase_uid', 'web-customer-001')->exists())->toBeTrue();
    expect($response->headers->getCookies())->not->toBeEmpty();
});

test('web customer can access me update profile and checkout with the customer cookie', function () {
    [$branch, $product, $small] = createMobileProductFixture();

    $loginResponse = $this->postJson('/api/v1/customer/auth/firebase/login', [
        'name' => 'Web Checkout User',
        'email' => 'web-checkout@example.com',
        'phone' => '+93700999111',
        'provider' => 'google',
        'idToken' => 'stub:web-checkout-user-001',
    ])->assertOk();

    $client = Client::query()
        ->where('firebase_uid', 'web-checkout-user-001')
        ->firstOrFail();
    $cookie = $loginResponse->headers->getCookies()[0];

    $this->withCookie($cookie->getName(), $cookie->getValue())
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('customer.firebase_uid', 'web-checkout-user-001')
        ->assertJsonPath('customer.name', 'Web Checkout User')
        ->assertJsonPath('customer.email', 'web-checkout@example.com');

    $this->withCookie($cookie->getName(), $cookie->getValue())
        ->patchJson('/api/v1/me', [
            'name' => 'Updated Web User',
            'phone' => '+93700111000',
        ])->assertOk()
        ->assertJsonPath('customer.name', 'Updated Web User')
        ->assertJsonPath('customer.phone', '+93700111000');

    $this->withCookie($cookie->getName(), $cookie->getValue())
        ->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'product_size_id' => $small->id,
            'quantity' => 2,
            'note' => 'Website checkout',
        ])->assertOk()
        ->assertJsonPath('data.items.0.product_id', $product->id)
        ->assertJsonPath('data.items.0.product_size_id', $small->id)
        ->assertJsonPath('data.totals.total', 1300);

    $checkoutResponse = $this->withCookie($cookie->getName(), $cookie->getValue())
        ->postJson('/api/v1/checkout', [
            'branch_id' => $branch->id,
            'order_type' => 'takeaway',
            'customer_note' => 'Website order note',
        ])->assertCreated()
        ->assertJsonPath('data.client_id', $client->id)
        ->assertJsonPath('data.customer_name', 'Updated Web User')
        ->assertJsonPath('data.customer_phone', '+93700111000')
        ->assertJsonPath('data.customer_note', 'Website order note')
        ->assertJsonPath('data.items_count', 1)
        ->assertJsonPath('data.items.0.product_id', $product->id)
        ->assertJsonPath('data.items.0.product_size_id', $small->id)
        ->assertJsonPath('data.items.0.note', 'Website checkout');

    $orderId = $checkoutResponse->json('data.id');

    expect(Order::whereKey($orderId)->where('client_id', $client->id)->exists())->toBeTrue();

    $this->withCookie($cookie->getName(), $cookie->getValue())
        ->getJson('/api/v1/me/orders')
        ->assertOk()
        ->assertJsonPath('data.0.id', $orderId);
});
