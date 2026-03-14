<?php

use App\Models\Client;
use App\Models\GuestSession;

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

test('mobile products endpoint requires a valid app key', function () {
    $this->getJson('/api/v1/mobile/products')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Unauthorized app client.');

    $this->getJson('/api/v1/mobile/products', [
        'X-App-Key' => 'test-mobile-key',
        'X-App-Platform' => 'ios',
    ])->assertOk();
});

test('guest session endpoint creates a guest session token', function () {
    $this->postJson('/api/v1/mobile/guest/session', [
        'device_id' => 'device-001',
        'platform' => 'ios',
        'app_version' => '1.0.0',
    ], [
        'X-App-Key' => 'test-mobile-key',
        'X-App-Platform' => 'ios',
    ])->assertCreated()
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

    $this->postJson('/api/v1/mobile/auth/firebase/sync', [
        'provider' => 'google',
        'name' => 'Ahmad Khan',
        'email' => 'ahmad@example.com',
        'phone' => '+93700111222',
        'avatar_url' => 'https://example.com/avatar.jpg',
    ], [
        'X-App-Key' => 'test-mobile-key',
        'X-App-Platform' => 'ios',
        'X-Guest-Token' => $guestSession->token,
        'Authorization' => 'Bearer stub:firebase-user-123',
    ])->assertOk()
        ->assertJsonPath('data.client.firebase_uid', 'firebase-user-123')
        ->assertJsonPath('data.client.name', 'Ahmad Khan')
        ->assertJsonPath('data.client.email', 'ahmad@example.com')
        ->assertJsonPath('data.guest_session.id', $guestSession->id)
        ->assertJsonPath('data.guest_session.merge_pending', true);

    expect(Client::where('firebase_uid', 'firebase-user-123')->exists())->toBeTrue();
});
