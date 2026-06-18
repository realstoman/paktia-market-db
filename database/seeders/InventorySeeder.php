<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryItem;
use App\Models\Property;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $property = Property::first();

        InventoryItem::create([
            'property_id' => $property->id,
            'name' => 'Rice (50kg)',
            'type' => 'consumable',
            'quantity' => 20,
            'unit' => 'bag',
        ]);

        InventoryItem::create([
            'property_id' => $property->id,
            'name' => 'Cashier Computer',
            'type' => 'fixed',
            'quantity' => 2,
            'unit' => 'piece',
        ]);
    }
}
