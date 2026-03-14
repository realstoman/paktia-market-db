<?php

use App\Models\Branch;
use App\Models\Client;
use App\Models\Country;
use App\Models\GuestSession;
use App\Models\Kitchen;
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

test('mobile products endpoint requires a valid app key', function () {
    $this->getJson('/api/v1/mobile/products')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Unauthorized app client.');

    $this->getJson('/api/v1/mobile/products', mobileHeaders())->assertOk();
});

test('guest session endpoint creates a guest session token', function () {
    $this->postJson('/api/v1/mobile/guest/session', [
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

    $response = $this->postJson('/api/v1/mobile/auth/firebase/sync', [
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

    $guestSessionResponse = $this->postJson('/api/v1/mobile/guest/session', [
        'device_id' => 'device-002',
        'platform' => 'ios',
    ], mobileHeaders())->assertCreated();

    $guestToken = $guestSessionResponse->json('data.guest_token');

    $this->getJson('/api/v1/mobile/cart', mobileHeaders([
        'X-Guest-Token' => $guestToken,
    ]))->assertOk()
        ->assertJsonPath('data.owner_type', 'guest')
        ->assertJsonCount(0, 'data.items');

    $addResponse = $this->postJson('/api/v1/mobile/cart/items', [
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

    $this->patchJson("/api/v1/mobile/cart/items/{$cartItemId}", [
        'quantity' => 3,
        'note' => 'No olives',
    ], mobileHeaders([
        'X-Guest-Token' => $guestToken,
    ]))->assertOk()
        ->assertJsonPath('data.items.0.quantity', 3)
        ->assertJsonPath('data.items.0.note', 'No olives')
        ->assertJsonPath('data.totals.total', 1950);

    $this->deleteJson("/api/v1/mobile/cart/items/{$cartItemId}", [], mobileHeaders([
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

    $this->postJson('/api/v1/mobile/cart/items', [
        'product_id' => $product->id,
        'product_size_id' => $small->id,
        'quantity' => 2,
        'note' => 'Extra sauce',
    ], mobileHeaders([
        'X-Guest-Token' => $guestSession->token,
    ]))->assertOk();

    $this->postJson('/api/v1/mobile/auth/firebase/sync', [
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
