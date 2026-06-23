<?php

use App\Models\Country;
use App\Models\Property;
use App\Models\Province;
use App\Models\Shareholder;
use App\Models\ShareholderDocument;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->create()->assignRole('super-admin'));
});

function shareholderProperty(string $name = 'Central Market'): Property
{
    $country = Country::query()->create([
        'name' => 'Afghanistan',
        'code' => fake()->unique()->lexify('??'),
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ]);
    $province = Province::query()->create([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);

    return Property::query()->create([
        'name' => $name,
        'property_type' => 'market',
        'usage_type' => 'commercial',
        'country_id' => $country->id,
        'province_id' => $province->id,
    ]);
}

function shareholderRecord(string $nid): Shareholder
{
    return Shareholder::query()->create([
        'full_name' => "Shareholder {$nid}",
        'nid_type' => 'electronic',
        'nid_number' => $nid,
    ]);
}

test('a shareholder can be registered with private documents and an initial property share', function () {
    Storage::fake('local');
    Storage::fake('public');
    $property = shareholderProperty();

    $this->post(route('shareholders.store'), [
        'full_name' => 'احمد خان',
        'father_name' => 'محمد خان',
        'nid_type' => 'electronic',
        'nid_number' => 'NID-1001',
        'phone' => '0700000000',
        'photo' => UploadedFile::fake()->image('profile.jpg'),
        'documents' => [UploadedFile::fake()->create('tazkira.pdf', 120, 'application/pdf')],
        'property_id' => $property->id,
        'percentage' => 35,
        'effective_from' => '2026-01-01',
    ])->assertRedirect();

    $shareholder = Shareholder::query()->where('nid_number', 'NID-1001')->firstOrFail();
    expect($shareholder->photo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($shareholder->photo_path);

    $document = $shareholder->documents()->firstOrFail();
    Storage::disk('local')->assertExists($document->path);
    $this->assertDatabaseHas('property_shareholdings', [
        'shareholder_id' => $shareholder->id,
        'property_id' => $property->id,
        'percentage' => 35,
        'effective_from' => '2026-01-01',
    ]);
});

test('property ownership cannot exceed one hundred percent for an overlapping period', function () {
    $property = shareholderProperty();
    $first = shareholderRecord('NID-2001');
    $second = shareholderRecord('NID-2002');

    $this->post(route('shareholders.shareholdings.store', $first), [
        'property_id' => $property->id,
        'percentage' => 60,
        'effective_from' => '2026-01-01',
    ])->assertSessionHasNoErrors();

    $this->post(route('shareholders.shareholdings.store', $second), [
        'property_id' => $property->id,
        'percentage' => 41,
        'effective_from' => '2026-06-01',
    ])->assertSessionHasErrors('percentage');

    expect($property->shareholdings()->count())->toBe(1);
});

test('a shareholder can be registered with different percentages across multiple properties', function () {
    $paktiaMarket = shareholderProperty('Paktia Market');
    $secondProperty = shareholderProperty('Kabul Residential Block');

    $this->post(route('shareholders.store'), [
        'full_name' => 'Multi Property Owner',
        'nid_type' => 'electronic',
        'nid_number' => 'NID-MULTI-1001',
        'shareholdings' => [
            [
                'property_id' => $paktiaMarket->id,
                'percentage' => 25,
                'effective_from' => '2026-01-01',
            ],
            [
                'property_id' => $secondProperty->id,
                'percentage' => 10,
                'effective_from' => '2026-01-01',
            ],
        ],
    ])->assertSessionHasNoErrors();

    $shareholder = Shareholder::query()->where('nid_number', 'NID-MULTI-1001')->firstOrFail();

    expect($shareholder->shareholdings()->count())->toBe(2);
    $this->assertDatabaseHas('property_shareholdings', [
        'shareholder_id' => $shareholder->id,
        'property_id' => $paktiaMarket->id,
        'percentage' => 25,
    ]);
    $this->assertDatabaseHas('property_shareholdings', [
        'shareholder_id' => $shareholder->id,
        'property_id' => $secondProperty->id,
        'percentage' => 10,
    ]);
});

test('historical ownership periods remain available for period based pnl', function () {
    $property = shareholderProperty();
    $shareholder = shareholderRecord('NID-3001');

    $this->post(route('shareholders.shareholdings.store', $shareholder), [
        'property_id' => $property->id,
        'percentage' => 25,
        'effective_from' => '2025-01-01',
        'effective_to' => '2025-12-31',
    ])->assertSessionHasNoErrors();

    $this->post(route('shareholders.shareholdings.store', $shareholder), [
        'property_id' => $property->id,
        'percentage' => 40,
        'effective_from' => '2026-01-01',
    ])->assertSessionHasNoErrors();

    expect($shareholder->shareholdings()->count())->toBe(2)
        ->and($shareholder->shareholdings()->effectiveDuring('2025-04-01', '2025-04-30')->first()->allocatedAmount(100000))
        ->toBe(25000.0);
});

test('finance users can view shareholders but cannot change them', function () {
    $financeUser = User::factory()->create();
    $financeUser->assignRole('finance');

    $this->actingAs($financeUser)
        ->get(route('shareholders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('shareholders/index'));

    $shareholder = shareholderRecord('NID-4000');

    $this->actingAs($financeUser)
        ->get(route('shareholders.show', $shareholder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shareholders/show')
            ->where('shareholder.id', $shareholder->id));

    $this->actingAs($financeUser)
        ->post(route('shareholders.store'), [
            'full_name' => 'Restricted User',
            'nid_type' => 'electronic',
            'nid_number' => 'NID-4001',
        ])
        ->assertForbidden();
});

test('shareholder documents require the matching shareholder route binding', function () {
    Storage::fake('local');
    $first = shareholderRecord('NID-5001');
    $second = shareholderRecord('NID-5002');
    $path = UploadedFile::fake()->create('identity.pdf', 30, 'application/pdf')
        ->store("shareholders/{$first->id}/documents", 'local');
    $document = ShareholderDocument::query()->create([
        'shareholder_id' => $first->id,
        'title' => 'Identity',
        'path' => $path,
        'original_name' => 'identity.pdf',
    ]);

    $this->get(route('shareholders.documents.download', [$second, $document]))->assertNotFound();
    $this->get(route('shareholders.documents.download', [$first, $document]))->assertOk();
});
