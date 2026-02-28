<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('pashto_name')->nullable()->after('name');
            $table->text('pashto_description')->nullable()->after('description');
            $table->string('dari_name')->nullable()->after('pashto_name');
            $table->text('dari_description')->nullable()->after('pashto_description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'pashto_name',
                'pashto_description',
                'dari_name',
                'dari_description',
            ]);
        });
    }
};
