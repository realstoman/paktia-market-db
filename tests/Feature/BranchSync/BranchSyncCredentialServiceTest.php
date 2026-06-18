<?php

use App\Models\Property;
use App\Models\PropertySyncCredential;
use App\Models\Country;
use App\Models\Province;
use App\Services\PropertySync\PropertySyncCredentialService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

function createPropertySyncProperty(bool $isActive = true): Property
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
        'description' => 'For sync tests',
        'is_active' => $isActive,
    ]);
}

test('issue persists an HMAC-prefixed token hash that validates back to the credential', function () {
    $property = createPropertySyncProperty();
    $service = app(PropertySyncCredentialService::class);

    $issued = $service->issue($property, 'property-server', ['health.read']);

    $credential = $issued['credential'];
    $token = $issued['plain_text_token'];

    expect($credential)->toBeInstanceOf(PropertySyncCredential::class);
    expect($credential->fresh()->token_hash)->toStartWith('hmac-sha256$');
    expect($token)->toMatch('/^[A-Za-z0-9]{40,}$/');

    $resolved = $service->validate($token, 'health.read');
    expect($resolved)->not->toBeNull();
    expect($resolved->id)->toBe($credential->id);
});

test('validate returns null for missing, malformed, or short tokens without DB lookup', function () {
    $property = createPropertySyncProperty();
    $service = app(PropertySyncCredentialService::class);
    $service->issue($property, 'property-server');

    DB::enableQueryLog();

    expect($service->validate(null))->toBeNull();
    expect($service->validate(''))->toBeNull();
    expect($service->validate('   '))->toBeNull();
    expect($service->validate('short-token'))->toBeNull();
    expect($service->validate('contains/illegal!chars'.str_repeat('A', 40)))->toBeNull();

    expect(DB::getQueryLog())->toBe([]);
});

test('validate accepts legacy SHA-256 hashes and upgrades them to the HMAC scheme on use', function () {
    $property = createPropertySyncProperty();
    $service = app(PropertySyncCredentialService::class);

    $plainTextToken = Str::random(64);
    $credential = PropertySyncCredential::query()->create([
        'property_id' => $property->id,
        'name' => 'legacy-credential',
        'token_hash' => hash('sha256', $plainTextToken),
        'abilities' => ['*'],
    ]);

    expect($credential->fresh()->token_hash)
        ->toBe(hash('sha256', $plainTextToken));

    $resolved = $service->validate($plainTextToken);

    expect($resolved)->not->toBeNull();
    expect($resolved->id)->toBe($credential->id);
    expect($credential->fresh()->token_hash)->toStartWith('hmac-sha256$');
});

test('validate refreshes last_used_at no more often than the configured throttle window', function () {
    $property = createPropertySyncProperty();
    $service = app(PropertySyncCredentialService::class);

    config()->set('pos.sync.last_used_throttle_seconds', 60);

    $issued = $service->issue($property, 'property-server');
    $token = $issued['plain_text_token'];

    $service->validate($token);
    $firstTimestamp = $issued['credential']->fresh()->last_used_at;
    expect($firstTimestamp)->not->toBeNull();

    // Within the throttle window: last_used_at should not change.
    $service->validate($token);
    expect($issued['credential']->fresh()->last_used_at?->equalTo($firstTimestamp))
        ->toBeTrue();

    // Beyond the throttle window: last_used_at should advance.
    $this->travel(120)->seconds();
    $service->validate($token);
    expect($issued['credential']->fresh()->last_used_at?->gt($firstTimestamp))
        ->toBeTrue();
});

test('validate rejects expired, revoked, or inactive-property credentials and unknown abilities', function () {
    $property = createPropertySyncProperty();
    $service = app(PropertySyncCredentialService::class);

    $expired = $service->issue($property, 'expired', ['health.read'], now()->subMinute());
    expect($service->validate($expired['plain_text_token']))->toBeNull();

    $revoked = $service->issue($property, 'revoked', ['health.read']);
    $service->revoke($revoked['credential']);
    expect($service->validate($revoked['plain_text_token']))->toBeNull();

    $scoped = $service->issue($property, 'scoped', ['health.read']);
    expect($service->validate($scoped['plain_text_token'], 'orders.write'))->toBeNull();
    expect($service->validate($scoped['plain_text_token'], 'health.read'))->not->toBeNull();

    $property->forceFill(['is_active' => false])->save();
    $stillActive = $service->issue($property, 'will-fail', ['health.read']);
    expect($service->validate($stillActive['plain_text_token']))->toBeNull();
});

test('issue rejects wildcard abilities by default and accepts them with allowWildcard', function () {
    $property = createPropertySyncProperty();
    $service = app(PropertySyncCredentialService::class);

    expect(fn () => $service->issue($property, 'wildcard', ['*']))
        ->toThrow(\InvalidArgumentException::class);

    expect(fn () => $service->issue($property, 'wildcard', ['health.read', '*']))
        ->toThrow(\InvalidArgumentException::class);

    $issued = $service->issue($property, 'wildcard', ['*'], allowWildcard: true);
    expect($issued['credential']->abilities)->toContain('*');

    config()->set('pos.sync.allow_wildcard_ability', true);
    $configIssued = $service->issue($property, 'wildcard-config', ['*']);
    expect($configIssued['credential']->abilities)->toContain('*');
});

test('issue defaults to health.read when no abilities are provided', function () {
    $property = createPropertySyncProperty();
    $service = app(PropertySyncCredentialService::class);

    $issued = $service->issue($property, 'defaults');
    expect($issued['credential']->abilities)->toBe(['health.read']);

    $issued = $service->issue($property, 'defaults-empty', []);
    expect($issued['credential']->abilities)->toBe(['health.read']);
});
