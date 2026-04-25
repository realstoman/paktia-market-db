<?php

use App\Models\Branch;
use App\Models\BranchSyncCredential;
use App\Models\Country;
use App\Models\Province;
use App\Services\BranchSync\BranchSyncCredentialService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

function createBranchSyncBranch(bool $isActive = true): Branch
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
        'name' => 'Branch Sync HQ',
        'address' => 'Kabul',
        'description' => 'For sync tests',
        'is_active' => $isActive,
    ]);
}

test('issue persists an HMAC-prefixed token hash that validates back to the credential', function () {
    $branch = createBranchSyncBranch();
    $service = app(BranchSyncCredentialService::class);

    $issued = $service->issue($branch, 'branch-server', ['health.read']);

    $credential = $issued['credential'];
    $token = $issued['plain_text_token'];

    expect($credential)->toBeInstanceOf(BranchSyncCredential::class);
    expect($credential->fresh()->token_hash)->toStartWith('hmac-sha256$');
    expect($token)->toMatch('/^[A-Za-z0-9]{40,}$/');

    $resolved = $service->validate($token, 'health.read');
    expect($resolved)->not->toBeNull();
    expect($resolved->id)->toBe($credential->id);
});

test('validate returns null for missing, malformed, or short tokens without DB lookup', function () {
    $branch = createBranchSyncBranch();
    $service = app(BranchSyncCredentialService::class);
    $service->issue($branch, 'branch-server');

    DB::enableQueryLog();

    expect($service->validate(null))->toBeNull();
    expect($service->validate(''))->toBeNull();
    expect($service->validate('   '))->toBeNull();
    expect($service->validate('short-token'))->toBeNull();
    expect($service->validate('contains/illegal!chars'.str_repeat('A', 40)))->toBeNull();

    expect(DB::getQueryLog())->toBe([]);
});

test('validate accepts legacy SHA-256 hashes and upgrades them to the HMAC scheme on use', function () {
    $branch = createBranchSyncBranch();
    $service = app(BranchSyncCredentialService::class);

    $plainTextToken = Str::random(64);
    $credential = BranchSyncCredential::query()->create([
        'branch_id' => $branch->id,
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
    $branch = createBranchSyncBranch();
    $service = app(BranchSyncCredentialService::class);

    config()->set('pos.sync.last_used_throttle_seconds', 60);

    $issued = $service->issue($branch, 'branch-server');
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

test('validate rejects expired, revoked, or inactive-branch credentials and unknown abilities', function () {
    $branch = createBranchSyncBranch();
    $service = app(BranchSyncCredentialService::class);

    $expired = $service->issue($branch, 'expired', ['*'], now()->subMinute());
    expect($service->validate($expired['plain_text_token']))->toBeNull();

    $revoked = $service->issue($branch, 'revoked');
    $service->revoke($revoked['credential']);
    expect($service->validate($revoked['plain_text_token']))->toBeNull();

    $scoped = $service->issue($branch, 'scoped', ['health.read']);
    expect($service->validate($scoped['plain_text_token'], 'orders.write'))->toBeNull();
    expect($service->validate($scoped['plain_text_token'], 'health.read'))->not->toBeNull();

    $branch->forceFill(['is_active' => false])->save();
    $stillActive = $service->issue($branch, 'will-fail');
    expect($service->validate($stillActive['plain_text_token']))->toBeNull();
});
