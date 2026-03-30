<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['branch_id', 'status', 'created_at'], 'orders_branch_status_created_idx');
            $table->index(['branch_table_id', 'status'], 'orders_branch_table_status_idx');
            $table->index(['order_type', 'status'], 'orders_type_status_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['is_active', 'name'], 'products_active_name_idx');
            $table->index(['product_category_id', 'is_active'], 'products_category_active_idx');
            $table->index(['kitchen_id', 'is_active'], 'products_kitchen_active_idx');
            $table->index(['type', 'is_active'], 'products_type_active_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_branch_status_created_idx');
            $table->dropIndex('orders_branch_table_status_idx');
            $table->dropIndex('orders_type_status_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_active_name_idx');
            $table->dropIndex('products_category_active_idx');
            $table->dropIndex('products_kitchen_active_idx');
            $table->dropIndex('products_type_active_idx');
        });
    }
};
