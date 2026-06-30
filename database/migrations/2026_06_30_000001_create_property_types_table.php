<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_types', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('name');
            $table->json('name_translations')->nullable();
            $table->string('behavior', 30)->default('market');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
            $table->index(['behavior', 'is_active']);
        });

        $now = now();
        DB::table('property_types')->insert([
            [
                'key' => 'market',
                'name' => 'مارکیت',
                'name_translations' => json_encode(['fa' => 'مارکیت', 'ps' => 'مارکېټ', 'en' => 'Market']),
                'behavior' => 'market',
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'mall',
                'name' => 'مال',
                'name_translations' => json_encode(['fa' => 'مال', 'ps' => 'مال', 'en' => 'Mall']),
                'behavior' => 'market',
                'is_active' => false,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'block',
                'name' => 'بلاک رهایشی',
                'name_translations' => json_encode(['fa' => 'بلاک رهایشی', 'ps' => 'رهایشي بلاک', 'en' => 'Residential block']),
                'behavior' => 'block',
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'house',
                'name' => 'خانه',
                'name_translations' => json_encode(['fa' => 'خانه', 'ps' => 'کور', 'en' => 'House']),
                'behavior' => 'house',
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'commercial_unit',
                'name' => 'واحد تجارتی / دکان–دفتر',
                'name_translations' => json_encode(['fa' => 'واحد تجارتی / دکان–دفتر', 'ps' => 'سوداګریز واحد / دوکان–دفتر', 'en' => 'Commercial unit / shop–office']),
                'behavior' => 'commercial_unit',
                'is_active' => true,
                'sort_order' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('property_types');
    }
};
