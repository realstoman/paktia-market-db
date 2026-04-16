<?php

use App\Enums\OrderItemPrepStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('kitchen_id')
                ->nullable()
                ->after('branch_id')
                ->constrained()
                ->nullOnDelete();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('prep_status')
                ->default(OrderItemPrepStatus::PENDING->value)
                ->after('kitchen_id');
            $table->timestamp('started_at')->nullable()->after('prep_status');
            $table->timestamp('ready_at')->nullable()->after('started_at');
            $table->timestamp('delivered_at')->nullable()->after('ready_at');
            $table->foreignId('prepared_by')
                ->nullable()
                ->after('delivered_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('kitchen_receipt_printed_at')
                ->nullable()
                ->after('prepared_by');
        });

        DB::table('order_items')
            ->whereNull('kitchen_id')
            ->update([
                'prep_status' => OrderItemPrepStatus::READY->value,
                'ready_at' => now(),
            ]);
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('prepared_by');
            $table->dropColumn([
                'prep_status',
                'started_at',
                'ready_at',
                'delivered_at',
                'kitchen_receipt_printed_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kitchen_id');
        });
    }
};
