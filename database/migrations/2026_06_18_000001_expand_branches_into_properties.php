<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('property_type', 20)->default('market')->after('name');
            $table->string('usage_type', 20)->default('commercial')->after('property_type');
            $table->string('image_path')->nullable()->after('usage_type');
            $table->decimal('distance_from_city_km', 10, 2)->nullable()->after('address');
            $table->decimal('land_area_sqm', 12, 2)->nullable()->after('distance_from_city_km');
            $table->decimal('building_area_sqm', 12, 2)->nullable()->after('land_area_sqm');
            $table->unsignedSmallInteger('declared_floors')->nullable()->after('building_area_sqm');
            $table->unsignedSmallInteger('declared_units')->nullable()->after('declared_floors');
            $table->unsignedSmallInteger('rooms_count')->nullable()->after('declared_units');
            $table->unsignedSmallInteger('kitchens_count')->nullable()->after('rooms_count');
            $table->unsignedSmallInteger('halls_count')->nullable()->after('kitchens_count');
            $table->unsignedSmallInteger('bathrooms_count')->nullable()->after('halls_count');
            $table->unsignedSmallInteger('parking_spaces')->nullable()->after('bathrooms_count');
            $table->year('year_built')->nullable()->after('parking_spaces');
            $table->json('amenities')->nullable()->after('year_built');
            $table->text('notes')->nullable()->after('amenities');
            $table->index(['property_type', 'is_active']);
        });

        Schema::create('property_floors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->smallInteger('level_number');
            $table->decimal('area_sqm', 12, 2)->nullable();
            $table->unsignedSmallInteger('planned_units')->nullable();
            $table->string('usage_type', 20)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['property_id', 'level_number']);
        });

        Schema::create('property_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_floor_id')->constrained()->cascadeOnDelete();
            $table->string('unit_type', 20);
            $table->string('unit_number');
            $table->decimal('area_sqm', 10, 2)->nullable();
            $table->decimal('width_m', 8, 2)->nullable();
            $table->decimal('length_m', 8, 2)->nullable();
            $table->unsignedSmallInteger('rooms_count')->nullable();
            $table->unsignedSmallInteger('kitchens_count')->nullable();
            $table->unsignedSmallInteger('halls_count')->nullable();
            $table->unsignedSmallInteger('bathrooms_count')->nullable();
            $table->string('occupancy_status', 20)->default('vacant');
            $table->string('electricity_meter')->nullable();
            $table->string('water_meter')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['property_floor_id', 'unit_number']);
            $table->index(['unit_type', 'occupancy_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_units');
        Schema::dropIfExists('property_floors');

        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex(['property_type', 'is_active']);
            $table->dropColumn([
                'property_type', 'usage_type', 'image_path', 'distance_from_city_km',
                'land_area_sqm', 'building_area_sqm', 'declared_floors', 'declared_units',
                'rooms_count', 'kitchens_count', 'halls_count', 'bathrooms_count',
                'parking_spaces', 'year_built', 'amenities', 'notes',
            ]);
        });
    }
};
