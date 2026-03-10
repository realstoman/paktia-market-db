<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kitchen_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('kitchen_category_kitchen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kitchen_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kitchen_category_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['kitchen_id', 'kitchen_category_id']);
        });

        $now = now();

        DB::table('kitchen_categories')->insert([
            ['name' => 'Pizza', 'description' => 'Pizza-focused production category.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Chicken Wings', 'description' => 'Chicken wings and similar fried items.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Burgers', 'description' => 'Burger preparation category.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'BBQ', 'description' => 'Barbecue and grill production category.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Rice', 'description' => 'Rice-based meals and sides.', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('kitchen_category_kitchen');
        Schema::dropIfExists('kitchen_categories');
    }
};
