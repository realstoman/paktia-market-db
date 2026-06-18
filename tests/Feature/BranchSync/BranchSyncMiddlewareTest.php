<?php

use App\Http\Middleware\EnsurePropertySyncAuthenticated;
use App\Models\Property;
use App\Models\Country;
use App\Models\Province;
use App\Services\PropertySync\PropertySyncCredentialService;

function createPropertySyncMiddlewareProperty(): Property
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

    return Property::create([
        'country_id' => $country->id,
        'province_id' => $province->id,
        'name' => 'Property Sync HQ',
        'address' => 'Kabul',
        'description' => 'For middleware tests',
        'is_active' => true,
    ]);
}

test('runtime-health endpoint rejects requests without the X-Property-Token header', function () {
    $this->getJson('/api/v1/property-sync/runtime-health')
        ->assertStatus(401)
        ->assertHeader('WWW-Authenticate', EnsurePropertySyncAuthenticated::TOKEN_HEADER)
        ->assertJson(['message' => 'Missing property sync token.']);
});

test('runtime-health endpoint rejects bearer-only tokens (no Authorization fallback)', function () {
    $property = createPropertySyncMiddlewareProperty();
    $issued = app(PropertySyncCredentialService::class)->issue($property, 'property-server', ['health.read']);

    $this->withHeaders([
        'Authorization' => 'Bearer '.$issued['plain_text_token'],
    ])->getJson('/api/v1/property-sync/runtime-health')
        ->assertStatus(401)
        ->assertJson(['message' => 'Missing property sync token.']);
});

test('runtime-health endpoint rejects invalid tokens with WWW-Authenticate hint', function () {
    $this->withHeaders([
        EnsurePropertySyncAuthenticated::TOKEN_HEADER => str_repeat('A', 64),
    ])->getJson('/api/v1/property-sync/runtime-health')
        ->assertStatus(401)
        ->assertHeader('WWW-Authenticate', EnsurePropertySyncAuthenticated::TOKEN_HEADER)
        ->assertJson(['message' => 'Unauthorized property sync client.']);
});

test('runtime-health endpoint accepts a valid X-Property-Token with the right ability', function () {
    $property = createPropertySyncMiddlewareProperty();
    $issued = app(PropertySyncCredentialService::class)->issue($property, 'property-server', ['health.read']);

    $this->withHeaders([
        EnsurePropertySyncAuthenticated::TOKEN_HEADER => $issued['plain_text_token'],
    ])->getJson('/api/v1/property-sync/runtime-health')
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['status', 'message', 'components'],
            'meta' => [
                'propertySync' => ['propertyId', 'credentialId', 'credentialName', 'abilities'],
            ],
        ])
        ->assertJsonPath('meta.propertySync.credentialId', $issued['credential']->id);
});
