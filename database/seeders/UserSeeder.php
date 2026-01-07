<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'stoman@email.com'],
            [
                'name' => 'Stoman - Super Admin',
                'password' => bcrypt('password'),
            ]
        );

        $user->assignRole('super-admin');
    }
}
