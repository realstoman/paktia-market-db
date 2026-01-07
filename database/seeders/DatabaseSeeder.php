<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CountrySeeder::class,
            ProvinceSeeder::class,

            RolePermissionSeeder::class,
            UserSeeder::class,

            BranchSeeder::class,
            KitchenSeeder::class,

            ProductCategorySeeder::class,
            ProductSizeSeeder::class,
            ProductSeeder::class,

            InventorySeeder::class,
        ]);
    }

    // public function run(): void
    // {
    //     // User::factory(10)->create();

    //     User::firstOrCreate(
    //         ['email' => 'test@example.com'],
    //         [
    //             'name' => 'Test User',
    //             'password' => 'password',
    //             'email_verified_at' => now(),
    //         ]
    //     );
    // }
}
