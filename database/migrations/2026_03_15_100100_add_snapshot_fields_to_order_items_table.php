<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('product_name_snapshot')->nullable()->after('product_id');
            $table->string('product_size_name_snapshot')->nullable()->after('product_size_id');
            $table->decimal('line_total', 12, 2)->default(0)->after('price');
            $table->text('note')->nullable()->after('line_total');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'product_name_snapshot',
                'product_size_name_snapshot',
                'line_total',
                'note',
            ]);
        });
    }
};
