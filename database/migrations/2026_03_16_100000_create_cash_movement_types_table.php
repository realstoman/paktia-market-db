<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_movement_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('default_direction', 10)->nullable();
            $table->boolean('requires_counterparty')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        DB::table('cash_movement_types')->insert([
            [
                'name' => 'Owner Deposit',
                'slug' => 'owner_deposit',
                'default_direction' => 'in',
                'requires_counterparty' => false,
                'is_active' => true,
                'sort_order' => 10,
                'description' => 'Owner adds funds to business cash or bank.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Owner Withdrawal',
                'slug' => 'owner_withdrawal',
                'default_direction' => 'out',
                'requires_counterparty' => false,
                'is_active' => true,
                'sort_order' => 20,
                'description' => 'Owner withdraws funds from business cash or bank.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Transfer',
                'slug' => 'transfer',
                'default_direction' => null,
                'requires_counterparty' => true,
                'is_active' => true,
                'sort_order' => 30,
                'description' => 'Internal transfer between two accounts.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Petty Cash Top-up',
                'slug' => 'petty_cash_topup',
                'default_direction' => null,
                'requires_counterparty' => true,
                'is_active' => true,
                'sort_order' => 40,
                'description' => 'Move funds into petty cash from another source account.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bank Deposit',
                'slug' => 'bank_deposit',
                'default_direction' => 'out',
                'requires_counterparty' => false,
                'is_active' => true,
                'sort_order' => 50,
                'description' => 'Move physical cash to bank.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bank Withdrawal',
                'slug' => 'bank_withdrawal',
                'default_direction' => 'in',
                'requires_counterparty' => false,
                'is_active' => true,
                'sort_order' => 60,
                'description' => 'Withdraw cash from bank.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Manual Adjustment',
                'slug' => 'manual_adjustment',
                'default_direction' => null,
                'requires_counterparty' => false,
                'is_active' => true,
                'sort_order' => 70,
                'description' => 'Manual correction with finance approval.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movement_types');
    }
};
