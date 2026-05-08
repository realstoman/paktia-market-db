<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('cuisine_id')
                ->nullable()
                ->after('product_category_id')
                ->constrained('cuisines')
                ->nullOnDelete();
        });

        $products = DB::table('products')
            ->select(['products.id', 'products.kitchen_id'])
            ->whereNull('products.cuisine_id')
            ->whereNotNull('products.kitchen_id')
            ->orderBy('products.id')
            ->get();

        foreach ($products as $product) {
            $cuisineIds = DB::table('cuisine_kitchen')
                ->where('kitchen_id', $product->kitchen_id)
                ->pluck('cuisine_id');

            if ($cuisineIds->count() === 1) {
                DB::table('products')
                    ->where('id', $product->id)
                    ->update(['cuisine_id' => (int) $cuisineIds->first()]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cuisine_id');
        });
    }
};
