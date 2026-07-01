<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('business_finance_entries')
            ->where('business_key', 'dubai_restaurant')
            ->where('currency_code', 'AED')
            ->update(['currency_code' => 'USD']);

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
