<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryItem;
use App\Models\Branch;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first();

        InventoryItem::create([
            'branch_id' => $branch->id,
            'name' => 'Rice (50kg)',
            'type' => 'consumable',
            'quantity' => 20,
            'unit' => 'bag',
        ]);

        InventoryItem::create([
            'branch_id' => $branch->id,
            'name' => 'Cashier Computer',
            'type' => 'fixed',
            'quantity' => 2,
            'unit' => 'piece',
        ]);
    }
}
