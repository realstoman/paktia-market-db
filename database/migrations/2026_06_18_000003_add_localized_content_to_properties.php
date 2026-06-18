<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->json('name_translations')->nullable()->after('name');
            $table->json('address_translations')->nullable()->after('address');
            $table->json('description_translations')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->dropColumn([
                'name_translations',
                'address_translations',
                'description_translations',
            ]);
        });
    }
};
