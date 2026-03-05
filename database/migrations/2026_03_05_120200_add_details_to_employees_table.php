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
            $table->foreignId('employment_type_id')
                ->nullable()
                ->after('branch_id')
                ->constrained('employment_types')
                ->nullOnDelete();

            $table->foreignId('employee_position_id')
                ->nullable()
                ->after('employment_type_id')
                ->constrained('employee_positions')
                ->nullOnDelete();

            $table->string('salary_currency', 3)
                ->default('AFN')
                ->after('salary');

            $table->string('status')
                ->default('active')
                ->after('salary_currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropConstrainedForeignId('employee_position_id');
            $table->dropConstrainedForeignId('employment_type_id');
            $table->dropColumn(['salary_currency', 'status']);
        });
    }
};
