<?php

use App\Models\ContractTemplate;
use App\Models\Country;
use App\Models\Lease;
use App\Models\Property;
use App\Models\Province;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->create()->assignRole('super-admin'));
});

function contractLeaseFixture(): array
{
    $country = Country::query()->create([
        'name' => 'افغانستان',
        'code' => fake()->unique()->lexify('??'),
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ]);
    $province = Province::query()->create([
        'country_id' => $country->id,
        'name' => 'پکتیا',
    ]);
    $property = Property::query()->create([
        'name' => 'مارکیت پکتیا',
        'property_type' => 'house',
        'usage_type' => 'residential',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'address' => 'گردیز',
    ]);
    $tenant = Tenant::query()->create([
        'full_name' => 'احمد خان',
        'business_name' => 'تجارت احمد',
        'phone' => '0700000000',
    ]);
    $lease = Lease::query()->create([
        'tenant_id' => $tenant->id,
        'property_id' => $property->id,
        'leased_space_type' => 'house',
        'start_date' => '2026-06-01',
        'end_date' => '2027-05-31',
        'rent_amount' => 25000,
        'payment_frequency' => 'monthly',
        'status' => 'active',
    ]);

    return compact('property', 'tenant', 'lease');
}

test('a default Dari rental contract template is installed', function () {
    $template = ContractTemplate::query()->where('is_default', true)->firstOrFail();

    expect($template->contract_title)->toContain('قرارداد')
        ->and($template->articles()->count())->toBe(8)
        ->and($template->articles()->first()->body)->toContain(':space');
});

test('a super admin can create a property specific contract template with ordered articles', function () {
    ['property' => $property] = contractLeaseFixture();

    $this->withUnencryptedCookie('locale', 'fa')
        ->post(route('contract-templates.store'), [
            'property_id' => $property->id,
            'name' => 'قرارداد مارکیت پکتیا',
            'contract_title' => 'قرارداد کرایه دکان',
            'intro_text' => 'میان :landlord_name و :tenant_name',
            'landlord_organization' => 'مارکیت پکتیا',
            'representative_name' => 'عبدالله',
            'representative_position' => 'رئیس اجرائیه',
            'representative_contact' => '0700000001',
            'landlord_signature_label' => 'امضاء مالک',
            'tenant_signature_label' => 'امضاء مستأجر',
            'witness_signature_label' => 'امضاء شاهد',
            'footer_text' => 'در دو نسخه ترتیب شد.',
            'is_default' => false,
            'is_active' => true,
            'articles' => [
                [
                    'article_number' => 'ماده اول',
                    'title' => 'موضوع',
                    'body' => 'اجاره :space',
                    'sort_order' => 1,
                ],
                [
                    'article_number' => 'ماده دوم',
                    'title' => 'کرایه',
                    'body' => 'مبلغ :rent_amount :currency',
                    'sort_order' => 2,
                ],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'قالب قرارداد با موفقیت ایجاد شد.');

    $template = ContractTemplate::query()
        ->where('name', 'قرارداد مارکیت پکتیا')
        ->firstOrFail();
    expect($template->property_id)->toBe($property->id)
        ->and($template->articles()->pluck('sort_order')->all())->toBe([1, 2]);
});

test('the lease contract page prefers an active property template', function () {
    ['property' => $property, 'tenant' => $tenant, 'lease' => $lease] = contractLeaseFixture();
    $template = ContractTemplate::query()->create([
        'property_id' => $property->id,
        'name' => 'قالب اختصاصی',
        'contract_title' => 'قرارداد اختصاصی',
        'landlord_organization' => 'مارکیت پکتیا',
        'representative_name' => 'رئیس',
        'representative_position' => 'رئیس اجرائیه',
        'landlord_signature_label' => 'مالک',
        'tenant_signature_label' => 'مستأجر',
        'witness_signature_label' => 'شاهد',
        'is_active' => true,
    ]);
    $template->articles()->create([
        'article_number' => 'ماده اول',
        'title' => 'موضوع',
        'body' => 'اجاره :property_name',
        'sort_order' => 1,
    ]);

    $this->get(route('tenants.leases.contract.show', [$tenant, $lease]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contracts/lease-contract')
            ->where('tenant.id', $tenant->id)
            ->where('lease.id', $lease->id)
            ->where('template.id', $template->id)
            ->where('template.articles.0.title', 'موضوع'));
});

test('signed contracts are stored privately and protected by the lease route', function () {
    Storage::fake('local');
    ['tenant' => $tenant, 'lease' => $lease] = contractLeaseFixture();
    $template = ContractTemplate::query()->where('is_default', true)->firstOrFail();

    $this->post(route('tenants.leases.contract-documents.store', [$tenant, $lease]), [
        'contract_template_id' => $template->id,
        'signed_at' => '2026-06-21',
        'document' => UploadedFile::fake()->create(
            'signed-contract.pdf',
            180,
            'application/pdf',
        ),
    ])->assertSessionHasNoErrors();

    $document = $lease->contractDocuments()->firstOrFail();
    Storage::disk('local')->assertExists($document->path);
    $this->get(route('tenants.leases.contract-documents.download', [
        $tenant,
        $lease,
        $document,
    ]))->assertDownload('signed-contract.pdf');

    ['tenant' => $otherTenant, 'lease' => $otherLease] = contractLeaseFixture();
    $this->get(route('tenants.leases.contract-documents.download', [
        $otherTenant,
        $otherLease,
        $document,
    ]))->assertNotFound();

    $this->delete(route('tenants.leases.contract-documents.destroy', [
        $tenant,
        $lease,
        $document,
    ]))->assertSessionHasNoErrors();
    Storage::disk('local')->assertMissing($document->path);
});

test('tenant lease and tenant route bindings must match for a contract', function () {
    ['tenant' => $tenant] = contractLeaseFixture();
    ['lease' => $otherLease] = contractLeaseFixture();

    $this->get(route('tenants.leases.contract.show', [$tenant, $otherLease]))
        ->assertNotFound();
});

test('finance users can view contracts but cannot upload signed files', function () {
    Storage::fake('local');
    ['tenant' => $tenant, 'lease' => $lease] = contractLeaseFixture();
    $financeUser = User::factory()->create()->assignRole('finance');

    $this->actingAs($financeUser)
        ->get(route('tenants.leases.contract.show', [$tenant, $lease]))
        ->assertOk();
    $this->actingAs($financeUser)
        ->post(route('tenants.leases.contract-documents.store', [$tenant, $lease]), [
            'document' => UploadedFile::fake()->create(
                'signed.pdf',
                10,
                'application/pdf',
            ),
        ])
        ->assertForbidden();
});
