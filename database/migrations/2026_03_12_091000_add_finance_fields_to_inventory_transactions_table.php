<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->decimal('unit_cost', 14, 4)->nullable()->after('quantity');
            $table->decimal('total_cost', 14, 2)->nullable()->after('unit_cost');
            $table->decimal('weighted_average_cost_after', 14, 4)->nullable()->after('total_cost');
            $table->string('reference_type')->nullable()->after('note');
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');

            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropIndex(['reference_type', 'reference_id']);
            $table->dropColumn([
                'unit_cost',
                'total_cost',
                'weighted_average_cost_after',
                'reference_type',
                'reference_id',
            ]);
        });
    }
};
