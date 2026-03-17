<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_contract_payment_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_contract_id')->constrained('employee_contracts')->cascadeOnDelete();
            $table->date('due_date');
            $table->string('title')->nullable();
            $table->decimal('percentage', 8, 2)->nullable();
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('status', 30)->default('draft');
            $table->string('payment_method', 50)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_contract_payment_schedules');
    }
};
