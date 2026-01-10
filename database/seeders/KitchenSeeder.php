<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kitchen;
use App\Models\Branch;

class KitchenSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first();

        $kitchens = [
            'Main Kitchen',
            'Grill Kitchen',
            'Dessert Kitchen',
            'Drinks & Bar',
        ];

        foreach ($kitchens as $kitchen) {
            Kitchen::create([
                'branch_id' => $branch->id,
                'name' => $kitchen,
            ]);
        }
    }
}
