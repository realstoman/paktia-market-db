<?php

use App\Models\Country;
use App\Models\Currency;
use App\Models\Lease;
use App\Models\Property;
use App\Models\Province;
use App\Models\RentPayment;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Finance\RentalFinanceService;
use Carbon\Carbon;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->create()->assignRole('super-admin'));
});

function rentalFinanceFixture(): array
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
        'name' => 'مارکیت مرکزی',
        'property_type' => 'house',
        'usage_type' => 'residential',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'address' => 'گردیز',
    ]);
    $currency = Currency::query()->firstOrCreate(['code' => 'AFN'], [
        'name' => 'Afghani',
        'symbol' => '؋',
    ]);
    $tenant = Tenant::query()->create([
        'full_name' => 'احمد خان',
        'business_name' => 'تجارت احمد',
        'phone' => '0700000000',
    ]);
    $lease = Lease::query()->create([
        'tenant_id' => $tenant->id,
        'property_id' => $property->id,
        'currency_id' => $currency->id,
        'leased_space_type' => 'house',
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'rent_amount' => 10000,
        'payment_frequency' => 'monthly',
        'status' => 'active',
    ]);

    return compact('property', 'currency', 'tenant', 'lease');
}

test('monthly leases calculate contracted rent for the selected period', function () {
    ['property' => $property] = rentalFinanceFixture();
    $summary = app(RentalFinanceService::class)->summary(
        Carbon::parse('2026-01-01'),
        Carbon::parse('2026-03-31'),
        $property->id,
    );

    expect($summary['expected'])->toBe(30000.0)
        ->and($summary['received'])->toBe(0.0)
        ->and($summary['outstanding'])->toBe(30000.0)
        ->and($summary['activeLeases'])->toBe(1);
});

test('finance users can record rent receipts against a tenant contract', function () {
    ['property' => $property, 'tenant' => $tenant, 'lease' => $lease] = rentalFinanceFixture();

    $this->withUnencryptedCookie('locale', 'fa')
        ->post(route('finance.rentals.store'), [
            'lease_id' => $lease->id,
            'period_start' => '2026-06-01',
            'period_end' => '2026-06-30',
            'payment_date' => '2026-06-05',
            'amount' => 10000,
            'payment_method' => 'cash',
            'reference' => 'Cash receipt',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'پرداخت کرایه با موفقیت ثبت شد.');

    $payment = RentPayment::query()->firstOrFail();
    expect($payment->tenant_id)->toBe($tenant->id)
        ->and($payment->property_id)->toBe($property->id)
        ->and($payment->receipt_number)->toStartWith('RNT-2026-');

    $this->get(route('finance.rentals.index', [
        'start_date' => '2026-06-01',
        'end_date' => '2026-06-30',
    ]))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('finance/rentals/index')
        ->where('summary.expected', 10000)
        ->where('summary.received', 10000)
        ->where('summary.outstanding', 0)
        ->where('payments.data.0.receipt_number', $payment->receipt_number));
});

test('void rent receipts remain auditable and are removed from totals', function () {
    ['property' => $property, 'tenant' => $tenant, 'lease' => $lease, 'currency' => $currency] = rentalFinanceFixture();
    $payment = RentPayment::query()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
        'property_id' => $property->id,
        'currency_id' => $currency->id,
        'period_start' => '2026-06-01',
        'period_end' => '2026-06-30',
        'payment_date' => '2026-06-05',
        'amount' => 10000,
        'payment_method' => 'cash',
        'status' => 'received',
    ]);

    $this->post(route('finance.rentals.void', $payment), [
        'void_reason' => 'Duplicate receipt',
    ])->assertSessionHasNoErrors();

    $summary = app(RentalFinanceService::class)->summary(
        Carbon::parse('2026-06-01'),
        Carbon::parse('2026-06-30'),
        $property->id,
    );
    expect($payment->fresh()->status)->toBe('void')
        ->and($payment->fresh()->void_reason)->toBe('Duplicate receipt')
        ->and($summary['received'])->toBe(0.0)
        ->and($summary['outstanding'])->toBe(10000.0);
});

test('rent and contract reports expose lease balances and contract coverage', function () {
    ['tenant' => $tenant, 'lease' => $lease] = rentalFinanceFixture();

    $this->get(route('reports.index', [
        'module' => 'rentals',
        'range' => 'custom',
        'start_date' => '2026-06-01',
        'end_date' => '2026-06-30',
    ]))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('activeReport.key', 'rentals')
        ->where('activeReport.rows.0.tenant', $tenant->full_name)
        ->where('activeReport.rows.0.contract', $lease->contract_number)
        ->where('activeReport.rows.0.expected', 10000)
        ->where('activeReport.rows.0.outstanding', 10000)
        ->where('activeReport.rows.0.signed', 'موجود نیست'));
});

test('view-only finance access cannot create or void rent receipts', function () {
    ['lease' => $lease] = rentalFinanceFixture();
    $viewer = User::factory()->create()->assignRole('view-only');

    $this->actingAs($viewer)->get(route('finance.rentals.index'))->assertOk();
    $this->actingAs($viewer)->post(route('finance.rentals.store'), [
        'lease_id' => $lease->id,
    ])->assertForbidden();
});
