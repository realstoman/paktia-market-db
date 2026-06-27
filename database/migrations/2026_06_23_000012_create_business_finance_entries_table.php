<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_finance_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('business_key', 60)->index();
            $table->date('entry_date')->index();
            $table->string('currency_code', 10)->default('USD');
            $table->decimal('valuation', 18, 2)->nullable();
            $table->decimal('sales', 18, 2)->default(0);
            $table->decimal('income', 18, 2)->default(0);
            $table->decimal('expenses', 18, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['business_key', 'entry_date'], 'business_finance_business_date_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_finance_entries');
    }
};
