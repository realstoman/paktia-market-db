<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_categories', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('name');
        });

        $categories = DB::table('product_categories')
            ->select(['id'])
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        foreach ($categories as $index => $category) {
            DB::table('product_categories')
                ->where('id', $category->id)
                ->update(['sort_order' => $index + 1]);
        }
    }

    public function down(): void
    {
        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
