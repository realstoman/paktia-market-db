<?php

use App\Models\Country;
use App\Models\Property;
use App\Models\PropertyFloor;
use App\Models\PropertyUnit;
use App\Models\Province;
use App\Models\Tenant;
use App\Models\TenantDocument;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->create()->assignRole('super-admin'));
});

function tenantProperty(string $type = 'market', string $name = 'Central Market'): Property
{
    $country = Country::query()->create([
        'name' => 'Afghanistan',
        'code' => fake()->unique()->lexify('??'),
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ]);
    $province = Province::query()->create([
        'country_id' => $country->id,
        'name' => 'Paktia',
    ]);

    return Property::query()->create([
        'name' => $name,
        'property_type' => $type,
        'usage_type' => in_array($type, ['market', 'mall', 'commercial_unit'], true) ? 'commercial' : 'residential',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'address' => 'Gardez',
    ]);
}

function tenantUnit(Property $property, string $type = 'shop', string $number = 'A-01'): PropertyUnit
{
    $floor = PropertyFloor::query()->create([
        'property_id' => $property->id,
        'name' => 'Ground Floor',
        'level_number' => 0,
    ]);

    return PropertyUnit::query()->create([
        'property_floor_id' => $floor->id,
        'unit_type' => $type,
        'unit_number' => $number,
    ]);
}

test('a tenant can be registered with private documents and an initial shop assignment', function () {
    Storage::fake('local');
    Storage::fake('public');
    $property = tenantProperty();
    $shop = tenantUnit($property);

    $this->post(route('tenants.store'), [
        'tenant_type' => 'company',
        'full_name' => 'احمد خان',
        'business_name' => 'احمد تجارتی شرکت',
        'phone' => '0700000000',
        'nid_number' => 'NID-TENANT-1',
        'photo' => UploadedFile::fake()->image('owner.jpg'),
        'documents' => [UploadedFile::fake()->create('license.pdf', 120, 'application/pdf')],
        'property_id' => $property->id,
        'property_unit_id' => $shop->id,
        'start_date' => '2026-06-01',
        'rent_amount' => 25000,
        'security_deposit' => 50000,
        'payment_frequency' => 'monthly',
        'status' => 'active',
    ])->assertSessionHasNoErrors()->assertRedirect();

    $tenant = Tenant::query()->where('nid_number', 'NID-TENANT-1')->firstOrFail();
    expect($tenant->card_code)->toStartWith('TEN-')
        ->and($tenant->leases()->count())->toBe(1)
        ->and($shop->fresh()->occupancy_status)->toBe('occupied');
    Storage::disk('public')->assertExists($tenant->photo_path);
    Storage::disk('local')->assertExists($tenant->documents()->firstOrFail()->path);
});

test('a market assignment requires a shop', function () {
    $property = tenantProperty();

    $this->post(route('tenants.store'), [
        'tenant_type' => 'individual',
        'full_name' => 'Market Tenant',
        'phone' => '0700000001',
        'property_id' => $property->id,
        'start_date' => '2026-06-01',
        'payment_frequency' => 'monthly',
        'status' => 'active',
    ])->assertSessionHasErrors('property_unit_id');

    expect(Tenant::query()->count())->toBe(0);
});

test('the same shop cannot have overlapping active contracts', function () {
    $property = tenantProperty();
    $shop = tenantUnit($property);
    $first = Tenant::query()->create(['full_name' => 'First Tenant', 'phone' => '1']);
    $second = Tenant::query()->create(['full_name' => 'Second Tenant', 'phone' => '2']);

    $payload = [
        'property_id' => $property->id,
        'property_unit_id' => $shop->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'payment_frequency' => 'monthly',
        'status' => 'active',
    ];
    $this->post(route('tenants.leases.store', $first), $payload)->assertSessionHasNoErrors();
    $this->post(route('tenants.leases.store', $second), [...$payload, 'start_date' => '2026-06-01'])
        ->assertSessionHasErrors('property_unit_id');

    expect($shop->leases()->count())->toBe(1);
});

test('a residential block supports either an apartment or complete block assignment', function () {
    $block = tenantProperty('block', 'Residential Block');
    $apartment = tenantUnit($block, 'apartment', '2-B');
    $tenant = Tenant::query()->create(['full_name' => 'Family Tenant', 'phone' => '3']);

    $this->post(route('tenants.leases.store', $tenant), [
        'property_id' => $block->id,
        'property_unit_id' => $apartment->id,
        'start_date' => '2026-01-01',
        'payment_frequency' => 'monthly',
        'status' => 'active',
    ])->assertSessionHasNoErrors();

    $lease = $tenant->leases()->firstOrFail();
    expect($lease->leased_space_type)->toBe('apartment')
        ->and($lease->property_floor_id)->toBe($apartment->property_floor_id);
});

test('a commercial unit is rented as one complete shop without internal market units', function () {
    $property = tenantProperty('commercial_unit', 'Kabul Exchange Office');
    $property->update([
        'host_market_name' => 'Kabul Money Exchange Market',
        'external_unit_number' => '47',
        'operating_mode' => 'vacant',
    ]);
    $tenant = Tenant::query()->create([
        'full_name' => 'Exchange Tenant',
        'phone' => '0700000099',
    ]);

    $this->post(route('tenants.leases.store', $tenant), [
        'property_id' => $property->id,
        'property_unit_id' => null,
        'start_date' => '2026-07-01',
        'rent_amount' => 50000,
        'payment_frequency' => 'monthly',
        'status' => 'active',
    ])->assertSessionHasNoErrors();

    $lease = $tenant->leases()->firstOrFail();
    expect($lease->leased_space_type)->toBe('shop')
        ->and($lease->property_unit_id)->toBeNull()
        ->and($property->fresh()->operating_mode)->toBe('rented');

    $this->get(route('tenants.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tenants.data.0.leases.0.property.external_unit_number', '47'));
});

test('tenant directory is paginated with fifteen records per page', function () {
    foreach (range(1, 16) as $number) {
        Tenant::query()->create([
            'full_name' => "Tenant {$number}",
            'phone' => "070000{$number}",
        ]);
    }

    $this->get(route('tenants.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tenants.per_page', 15)
            ->where('tenants.total', 16)
            ->where('tenants.last_page', 2)
            ->has('tenants.data', 15));

    $this->get(route('tenants.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tenants.current_page', 2)
            ->has('tenants.data', 1));
});

test('tenant edit cell action can open the profile edit dialog directly', function () {
    $tenant = Tenant::query()->create([
        'full_name' => 'Editable Tenant',
        'phone' => '0700000100',
    ]);

    $this->get(route('tenants.show', ['tenant' => $tenant, 'edit' => 1]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('openEdit', true));
});

test('tenant status messages follow the selected locale', function (
    string $locale,
    bool $initialStatus,
    string $expectedMessage,
) {
    $tenant = Tenant::query()->create([
        'full_name' => 'احمد خان',
        'business_name' => 'تجارت احمد',
        'phone' => '0700000101',
        'is_active' => $initialStatus,
    ]);

    $this->withUnencryptedCookie('locale', $locale)
        ->post(route('tenants.toggle', $tenant))
        ->assertRedirect()
        ->assertSessionHas('success', $expectedMessage);
})->with([
    'Dari deactivation' => [
        'fa',
        true,
        'تجارت احمد با موفقیت غیرفعال شد.',
    ],
    'Pashto activation' => [
        'ps',
        false,
        'تجارت احمد په بریالیتوب سره فعال شو.',
    ],
]);

test('finance users can view tenant profiles and cards but cannot manage tenants', function () {
    $tenant = Tenant::query()->create(['full_name' => 'View Only Tenant', 'phone' => '4']);
    $financeUser = User::factory()->create()->assignRole('finance');

    $this->actingAs($financeUser)->get(route('tenants.index'))
        ->assertOk()->assertInertia(fn (Assert $page) => $page->component('tenants/index'));
    $this->actingAs($financeUser)->get(route('tenants.show', $tenant))->assertOk();
    $this->actingAs($financeUser)->get(route('tenants.card', $tenant))->assertOk();
    $this->actingAs($financeUser)->post(route('tenants.store'), [])->assertForbidden();
});

test('tenant documents require matching tenant route binding', function () {
    Storage::fake('local');
    $first = Tenant::query()->create(['full_name' => 'First', 'phone' => '5']);
    $second = Tenant::query()->create(['full_name' => 'Second', 'phone' => '6']);
    $path = UploadedFile::fake()->create('identity.pdf', 30, 'application/pdf')->store("tenants/{$first->id}/documents", 'local');
    $document = TenantDocument::query()->create([
        'tenant_id' => $first->id,
        'title' => 'Identity',
        'path' => $path,
        'original_name' => 'identity.pdf',
    ]);

    $this->get(route('tenants.documents.download', [$second, $document]))->assertNotFound();
    $this->get(route('tenants.documents.download', [$first, $document]))->assertOk();
});
