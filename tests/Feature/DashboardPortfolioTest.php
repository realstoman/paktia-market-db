<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Province;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('dashboard exposes overall and project portfolio statistics', function () {
    $role = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);
    $user = User::factory()->create();
    $user->assignRole($role);
    $country = Country::query()->create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => '؋',
    ]);
    $province = Province::query()->create([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);
    $branch = Branch::query()->create([
        'name' => 'Paktia Market',
        'country_id' => $country->id,
        'province_id' => $province->id,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('data.portfolio.totalProjects', 1)
            ->where('data.portfolio.activeProjects', 1)
            ->where('data.portfolio.projects.0.id', $branch->id)
            ->where('data.portfolio.projects.0.name', 'Paktia Market')
            ->where('data.portfolio.projects.0.rent.collectedAfn', 0)
            ->where('data.portfolio.projects.0.rent.collectedUsd', 0)
        );
});
