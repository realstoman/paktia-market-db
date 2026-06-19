<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table): void {
            $table->id();
            $table->string('card_code', 32)->unique();
            $table->string('tenant_type', 20)->default('individual');
            $table->string('full_name');
            $table->string('father_name')->nullable();
            $table->string('business_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('email')->nullable();
            $table->string('nid_number')->nullable()->index();
            $table->string('license_number')->nullable();
            $table->text('address')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['full_name', 'business_name']);
        });

        Schema::create('tenant_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 40)->default('other');
            $table->string('title');
            $table->string('document_number')->nullable();
            $table->date('expires_at')->nullable();
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->timestamps();
        });

        Schema::create('leases', function (Blueprint $table): void {
            $table->id();
            $table->string('contract_number', 40)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_floor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('property_unit_id')->nullable()->constrained()->nullOnDelete();
            $table->string('leased_space_type', 30);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('rent_amount', 18, 2)->nullable();
            $table->decimal('security_deposit', 18, 2)->nullable();
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->string('payment_frequency', 20)->default('monthly');
            $table->string('status', 20)->default('active');
            $table->text('terms')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['property_id', 'start_date', 'end_date'], 'leases_property_period_idx');
            $table->index(['property_unit_id', 'start_date', 'end_date'], 'leases_unit_period_idx');
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leases');
        Schema::dropIfExists('tenant_documents');
        Schema::dropIfExists('tenants');
    }
};
