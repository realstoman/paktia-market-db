<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_account_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('mapping_key')->unique();
            $table->foreignId('account_id')->constrained('finance_accounts')->restrictOnDelete();
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_account_mappings');
    }
};
