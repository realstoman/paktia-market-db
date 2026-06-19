<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->unsignedInteger('display_order')->default(0)->index();
        });

        DB::table('properties')
            ->orderBy('created_at')
            ->orderBy('id')
            ->pluck('id')
            ->each(function (int $propertyId, int $index): void {
                DB::table('properties')
                    ->where('id', $propertyId)
                    ->update(['display_order' => $index + 1]);
            });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex(['display_order']);
            $table->dropColumn('display_order');
        });
    }
};
