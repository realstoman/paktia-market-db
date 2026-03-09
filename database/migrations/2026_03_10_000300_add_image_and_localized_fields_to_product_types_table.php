<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_types', function (Blueprint $table) {
            $table->string('pashto_name')->nullable()->after('name');
            $table->string('dari_name')->nullable()->after('pashto_name');
            $table->text('description')->nullable()->after('dari_name');
            $table->text('pashto_description')->nullable()->after('description');
            $table->text('dari_description')->nullable()->after('pashto_description');
            $table->string('image_path')->nullable()->after('dari_description');
        });
    }

    public function down(): void
    {
        Schema::table('product_types', function (Blueprint $table) {
            $table->dropColumn([
                'pashto_name',
                'dari_name',
                'description',
                'pashto_description',
                'dari_description',
                'image_path',
            ]);
        });
    }
};
