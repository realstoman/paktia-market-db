<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('customer_id')
                ->nullable()
                ->after('client_id')
                ->constrained('customers')
                ->nullOnDelete();
            $table->foreignId('discount_card_id')
                ->nullable()
                ->after('customer_note')
                ->constrained('discount_cards')
                ->nullOnDelete();
            $table->string('discount_type', 20)->nullable()->after('discount_card_id');
            $table->decimal('discount_value', 12, 2)->nullable()->after('discount_type');
            $table->string('discount_label')->nullable()->after('discount_value');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
            $table->dropConstrainedForeignId('discount_card_id');
            $table->dropColumn([
                'discount_type',
                'discount_value',
                'discount_label',
            ]);
        });
    }
};
