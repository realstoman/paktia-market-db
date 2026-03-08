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
        Schema::table('employees', function (Blueprint $table) {
            $table->date('contract_start_date')->nullable()->after('salary_currency');
            $table->date('contract_end_date')->nullable()->after('contract_start_date');
            $table->decimal('contract_amount', 10, 2)->nullable()->after('contract_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'contract_start_date',
                'contract_end_date',
                'contract_amount',
            ]);
        });
    }
};
