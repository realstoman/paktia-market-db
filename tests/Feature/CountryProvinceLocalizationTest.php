<?php

use App\Models\Country;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->create()->assignRole('super-admin'));
});

test('countries and provinces store localized names and return the active locale', function () {
    $this->withUnencryptedCookie('locale', 'fa')->post(route('countries.store'), [
        'name' => 'Afghanistan',
        'name_fa' => 'افغانستان',
        'name_ps' => 'افغانستان',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ])->assertRedirect(route('countries.index'))
        ->assertSessionHas('success', 'کشور با موفقیت ایجاد شد.');

    $country = Country::query()->firstOrFail();

    expect($country->name_translations)->toMatchArray([
        'en' => 'Afghanistan',
        'fa' => 'افغانستان',
        'ps' => 'افغانستان',
    ]);

    $this->withUnencryptedCookie('locale', 'fa')->post(route('provinces.store'), [
        'country_id' => $country->id,
        'name' => 'Paktia',
        'name_fa' => 'پکتیا',
        'name_ps' => 'پکتیا',
    ])->assertRedirect(route('countries.index'))
        ->assertSessionHas('success', 'ولایت با موفقیت ایجاد شد.');

    $province = Province::query()->firstOrFail();

    expect($province->name_translations)->toMatchArray([
        'en' => 'Paktia',
        'fa' => 'پکتیا',
        'ps' => 'پکتیا',
    ]);

    $this->withUnencryptedCookie('locale', 'fa')
        ->get(route('countries.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('countries.0.name', 'افغانستان')
            ->where('countries.0.provinces.0.name', 'پکتیا'));

    $this->withUnencryptedCookie('locale', 'en')
        ->get(route('countries.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('countries.0.name', 'Afghanistan')
            ->where('countries.0.provinces.0.name', 'Paktia'));
});

test('localized country and province names can be edited', function () {
    $country = Country::query()->create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ]);
    $province = $country->provinces()->create(['name' => 'Kabul']);

    $this->withUnencryptedCookie('locale', 'ps')->put(route('countries.update', $country), [
        'name' => 'Afghanistan',
        'name_fa' => 'افغانستان',
        'name_ps' => 'افغانستان',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ])->assertRedirect()
        ->assertSessionHas('success', 'هېواد په بریالیتوب سره تازه شو.');

    $this->withUnencryptedCookie('locale', 'ps')->put(route('provinces.update', $province), [
        'country_id' => $country->id,
        'name' => 'Kabul',
        'name_fa' => 'کابل',
        'name_ps' => 'کابل',
    ])->assertRedirect()
        ->assertSessionHas('success', 'ولایت په بریالیتوب سره تازه شو.');

    expect($country->fresh()->name_translations['fa'])->toBe('افغانستان')
        ->and($province->fresh()->name_translations['ps'])->toBe('کابل');
});
