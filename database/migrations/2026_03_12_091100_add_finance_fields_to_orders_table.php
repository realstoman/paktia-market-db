<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('sub_total_amount', 12, 2)->default(0)->after('exchange_rate');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('sub_total_amount');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('discount_amount');
            $table->decimal('service_charge_amount', 12, 2)->default(0)->after('tax_amount');
            $table->decimal('refund_amount', 12, 2)->default(0)->after('change_amount');
            $table->string('source')->nullable()->after('order_type');
            $table->timestamp('completed_at')->nullable()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'sub_total_amount',
                'discount_amount',
                'tax_amount',
                'service_charge_amount',
                'refund_amount',
                'source',
                'completed_at',
                'cancelled_at',
            ]);
        });
    }
};
