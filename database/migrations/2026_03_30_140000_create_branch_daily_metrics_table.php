<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->date('metric_date');
            $table->unsignedInteger('orders_total')->default(0);
            $table->unsignedInteger('completed_orders_total')->default(0);
            $table->unsignedInteger('cancelled_orders_total')->default(0);
            $table->decimal('gross_sales_total', 14, 2)->default(0);
            $table->decimal('completed_sales_total', 14, 2)->default(0);
            $table->decimal('expenses_total', 14, 2)->default(0);
            $table->timestamp('last_projected_at')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'metric_date']);
            $table->index(['metric_date', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_daily_metrics');
    }
};
