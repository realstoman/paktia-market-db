<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_run_items', function (Blueprint $table) {
            $table->json('covered_period_dates')->nullable()->after('payment_date');
            $table->unsignedInteger('covered_month_count')->default(1)->after('covered_period_dates');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_run_items', function (Blueprint $table) {
            $table->dropColumn([
                'covered_period_dates',
                'covered_month_count',
            ]);
        });
    }
};
