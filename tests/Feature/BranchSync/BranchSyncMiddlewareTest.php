<?php

use App\Http\Middleware\EnsureBranchSyncAuthenticated;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Province;
use App\Services\BranchSync\BranchSyncCredentialService;

function createBranchSyncMiddlewareBranch(): Branch
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
        'description' => 'For middleware tests',
        'is_active' => true,
    ]);
}

test('runtime-health endpoint rejects requests without the X-Branch-Token header', function () {
    $this->getJson('/api/v1/branch-sync/runtime-health')
        ->assertStatus(401)
        ->assertHeader('WWW-Authenticate', EnsureBranchSyncAuthenticated::TOKEN_HEADER)
        ->assertJson(['message' => 'Missing branch sync token.']);
});

test('runtime-health endpoint rejects bearer-only tokens (no Authorization fallback)', function () {
    $branch = createBranchSyncMiddlewareBranch();
    $issued = app(BranchSyncCredentialService::class)->issue($branch, 'branch-server', ['health.read']);

    $this->withHeaders([
        'Authorization' => 'Bearer '.$issued['plain_text_token'],
    ])->getJson('/api/v1/branch-sync/runtime-health')
        ->assertStatus(401)
        ->assertJson(['message' => 'Missing branch sync token.']);
});

test('runtime-health endpoint rejects invalid tokens with WWW-Authenticate hint', function () {
    $this->withHeaders([
        EnsureBranchSyncAuthenticated::TOKEN_HEADER => str_repeat('A', 64),
    ])->getJson('/api/v1/branch-sync/runtime-health')
        ->assertStatus(401)
        ->assertHeader('WWW-Authenticate', EnsureBranchSyncAuthenticated::TOKEN_HEADER)
        ->assertJson(['message' => 'Unauthorized branch sync client.']);
});

test('runtime-health endpoint accepts a valid X-Branch-Token with the right ability', function () {
    $branch = createBranchSyncMiddlewareBranch();
    $issued = app(BranchSyncCredentialService::class)->issue($branch, 'branch-server', ['health.read']);

    $this->withHeaders([
        EnsureBranchSyncAuthenticated::TOKEN_HEADER => $issued['plain_text_token'],
    ])->getJson('/api/v1/branch-sync/runtime-health')
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['status', 'message', 'components'],
            'meta' => [
                'branchSync' => ['branchId', 'credentialId', 'credentialName', 'abilities'],
            ],
        ])
        ->assertJsonPath('meta.branchSync.credentialId', $issued['credential']->id);
});
