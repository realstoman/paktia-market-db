<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->after('property_id')->constrained('vendors')->nullOnDelete();
            $table->foreignId('account_id')->nullable()->after('expense_type')->constrained('finance_accounts')->nullOnDelete();
            $table->foreignId('paid_from_account_id')->nullable()->after('account_id')->constrained('finance_accounts')->nullOnDelete();
            $table->string('payment_method', 50)->nullable()->after('amount');
            $table->text('description')->nullable()->after('payment_method');
            $table->string('approval_status', 30)->default('draft')->after('expense_date');
            $table->foreignId('created_by')->nullable()->after('approval_status')->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_id');
            $table->dropConstrainedForeignId('account_id');
            $table->dropConstrainedForeignId('paid_from_account_id');
            $table->dropConstrainedForeignId('created_by');
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn([
                'payment_method',
                'description',
                'approval_status',
                'approved_at',
            ]);
        });
    }
};
