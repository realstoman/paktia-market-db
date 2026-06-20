<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->string('host_market_name')->nullable()->after('usage_type');
            $table->json('host_market_name_translations')->nullable()->after('host_market_name');
            $table->string('external_unit_number', 100)->nullable()->after('host_market_name_translations');
            $table->string('external_floor', 100)->nullable()->after('external_unit_number');
            $table->string('ownership_type', 20)->default('owned')->after('external_floor');
            $table->string('operating_mode', 30)->default('owner_occupied')->after('ownership_type');
            $table->json('business_activities')->nullable()->after('operating_mode');
            $table->string('title_deed_number', 150)->nullable()->after('business_activities');
            $table->index(['property_type', 'operating_mode']);
        });

        Schema::create('property_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 40)->default('other');
            $table->string('title');
            $table->string('document_number')->nullable();
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->timestamps();
            $table->index(['property_id', 'document_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_documents');

        Schema::table('properties', function (Blueprint $table): void {
            $table->dropIndex(['property_type', 'operating_mode']);
            $table->dropColumn([
                'host_market_name',
                'host_market_name_translations',
                'external_unit_number',
                'external_floor',
                'ownership_type',
                'operating_mode',
                'business_activities',
                'title_deed_number',
            ]);
        });
    }
};
