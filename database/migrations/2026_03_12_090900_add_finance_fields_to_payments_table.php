<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dateTime('payment_date')->nullable()->after('method');
            $table->string('status', 30)->default('paid')->after('payment_date');
            $table->foreignId('received_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->string('reference_number')->nullable()->after('received_by');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('received_by');
            $table->dropColumn([
                'payment_date',
                'status',
                'reference_number',
            ]);
        });
    }
};
