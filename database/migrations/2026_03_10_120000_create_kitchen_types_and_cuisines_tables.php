<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kitchen_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('cuisines', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('cuisine_kitchen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kitchen_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cuisine_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['kitchen_id', 'cuisine_id']);
        });

        Schema::table('kitchens', function (Blueprint $table) {
            $table->foreignId('kitchen_type_id')
                ->nullable()
                ->after('name')
                ->constrained('kitchen_types')
                ->nullOnDelete();
        });

        $now = now();

        DB::table('kitchen_types')->insert([
            ['name' => 'Main', 'description' => 'Primary kitchen station for main dish preparation.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Grill', 'description' => 'Grill and barbecue station.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Pizza', 'description' => 'Pizza preparation and oven station.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Dessert', 'description' => 'Dessert and sweets preparation station.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Drinks', 'description' => 'Drinks and beverage station.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('cuisines')->insert([
            ['name' => 'Afghan', 'description' => 'Afghan cuisine.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Indian', 'description' => 'Indian cuisine.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Pakistani', 'description' => 'Pakistani cuisine.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        $typeIdBySlug = DB::table('kitchen_types')
            ->get(['id', 'name'])
            ->mapWithKeys(fn ($type) => [strtolower((string) $type->name) => $type->id]);

        DB::table('kitchens')
            ->select(['id', 'type'])
            ->orderBy('id')
            ->get()
            ->each(function ($kitchen) use ($typeIdBySlug) {
                $slug = strtolower(trim((string) $kitchen->type));
                $typeId = $typeIdBySlug[$slug] ?? null;

                if ($typeId) {
                    DB::table('kitchens')
                        ->where('id', $kitchen->id)
                        ->update(['kitchen_type_id' => $typeId]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('kitchens', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kitchen_type_id');
        });

        Schema::dropIfExists('cuisine_kitchen');
        Schema::dropIfExists('cuisines');
        Schema::dropIfExists('kitchen_types');
    }
};
