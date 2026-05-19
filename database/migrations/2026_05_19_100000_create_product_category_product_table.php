<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_category_product', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_category_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(
                ['product_id', 'product_category_id'],
                'product_category_product_unique',
            );
        });

        $now = now();

        $rows = DB::table('products')
            ->select(['id as product_id', 'product_category_id'])
            ->whereNotNull('product_category_id')
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'product_category_id' => $row->product_category_id,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        if (! empty($rows)) {
            DB::table('product_category_product')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_category_product');
    }
};
