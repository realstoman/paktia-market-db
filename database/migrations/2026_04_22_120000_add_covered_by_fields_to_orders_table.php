<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('covered_by_employee_id')
                ->nullable()
                ->after('customer_note')
                ->constrained('employees')
                ->nullOnDelete();
            $table->text('covered_by_note')
                ->nullable()
                ->after('covered_by_employee_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('covered_by_employee_id');
            $table->dropColumn('covered_by_note');
        });
    }
};
