<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('inventory_types')->insert([
            [
                'name' => 'Consumable',
                'description' => 'Regular consumable inventory items.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Fixed',
                'description' => 'Fixed/non-consumable assets.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Grocery',
                'description' => 'Grocery related stock.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Food',
                'description' => 'Prepared food and ingredients.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Other',
                'description' => 'Other inventory type.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreignId('inventory_type_id')
                ->nullable()
                ->after('category_id')
                ->constrained('inventory_types')
                ->nullOnDelete();
        });

        $typesByName = DB::table('inventory_types')
            ->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [strtolower(trim($name)) => $id]);

        DB::table('inventory_items')
            ->select(['id', 'type'])
            ->orderBy('id')
            ->chunk(200, function ($items) use ($typesByName) {
                foreach ($items as $item) {
                    $key = strtolower(trim((string) $item->type));
                    $typeId = $typesByName[$key] ?? null;

                    if (! $typeId) {
                        continue;
                    }

                    DB::table('inventory_items')
                        ->where('id', $item->id)
                        ->update(['inventory_type_id' => $typeId]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_type_id');
        });

        Schema::dropIfExists('inventory_types');
    }
};
