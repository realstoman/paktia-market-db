<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Printer;
use App\Models\Province;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

function createPrinterBaseData(): array
{
    $country = Country::create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
        'is_active' => true,
    ]);

    $province = Province::create([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);

    $branch = Branch::create([
        'name' => 'Baba Main',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'is_active' => true,
    ]);

    $kitchen = Kitchen::create([
        'branch_id' => $branch->id,
        'name' => 'Kababs Kitchen',
        'is_active' => true,
    ]);

    return [$branch, $kitchen];
}

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('super admin can access printers index', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $user->assignRole('super-admin');

    $this->actingAs($user)
        ->get(route('printers.index'))
        ->assertOk();
});

test('non super admin cannot access printers index', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $user->assignRole('cashier');

    $this->actingAs($user)
        ->get(route('printers.index'))
        ->assertForbidden();
});

test('super admin can create a printer with an assignment', function () {
    [$branch, $kitchen] = createPrinterBaseData();
    $user = User::factory()->withoutTwoFactor()->create();
    $user->assignRole('super-admin');

    $this->actingAs($user)
        ->post(route('printers.store'), [
            'branch_id' => $branch->id,
            'name' => 'Kababs Wall Printer',
            'ip_address' => '192.168.10.22',
            'port' => 9100,
            'connection_type' => 'network',
            'paper_width' => '80mm',
            'copies' => 1,
            'is_active' => true,
            'assignments' => [
                [
                    'assignment_type' => 'kitchen',
                    'kitchen_id' => $kitchen->id,
                    'order_type' => null,
                    'station_label' => null,
                    'is_active' => true,
                ],
            ],
        ])
        ->assertRedirect(route('printers.index'));

    $printer = Printer::query()->where('name', 'Kababs Wall Printer')->first();

    expect($printer)->not->toBeNull();
    expect($printer?->ip_address)->toBe('192.168.10.22');
    expect($printer?->assignments()->count())->toBe(1);
});
