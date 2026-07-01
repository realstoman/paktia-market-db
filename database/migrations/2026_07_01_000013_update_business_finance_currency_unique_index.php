<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_finance_entries', function (Blueprint $table): void {
            $table->dropUnique('business_finance_business_date_unique');
            $table->unique(['business_key', 'entry_date', 'currency_code'], 'business_finance_business_date_currency_unique');
        });
    }

    public function down(): void
    {
        Schema::table('business_finance_entries', function (Blueprint $table): void {
            $table->dropUnique('business_finance_business_date_currency_unique');
            $table->unique(['business_key', 'entry_date'], 'business_finance_business_date_unique');
        });
    }
};
