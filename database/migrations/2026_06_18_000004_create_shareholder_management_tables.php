<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shareholders', function (Blueprint $table): void {
            $table->id();
            $table->string('full_name');
            $table->string('father_name')->nullable();
            $table->string('grandfather_name')->nullable();
            $table->string('gender', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->foreignId('country_of_birth_id')->nullable()->constrained('countries')->nullOnDelete();
            $table->foreignId('citizenship_country_id')->nullable()->constrained('countries')->nullOnDelete();
            $table->string('nid_type', 30)->default('electronic');
            $table->string('nid_number')->unique();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('email')->nullable();
            $table->string('occupation')->nullable();
            $table->text('address')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['full_name', 'is_active']);
        });

        Schema::create('shareholder_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shareholder_id')->constrained()->cascadeOnDelete();
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

        Schema::create('property_shareholdings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shareholder_id')->constrained()->cascadeOnDelete();
            $table->decimal('percentage', 7, 4);
            $table->decimal('capital_contribution', 18, 2)->nullable();
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['property_id', 'effective_from', 'effective_to'], 'ownership_property_period_idx');
            $table->index(['shareholder_id', 'effective_from', 'effective_to'], 'ownership_shareholder_period_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_shareholdings');
        Schema::dropIfExists('shareholder_documents');
        Schema::dropIfExists('shareholders');
    }
};
