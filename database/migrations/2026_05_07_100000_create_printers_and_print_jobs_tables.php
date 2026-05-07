<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('ip_address');
            $table->unsignedInteger('port')->default(9100);
            $table->string('connection_type')->default('network');
            $table->string('paper_width')->default('80mm');
            $table->unsignedTinyInteger('copies')->default(1);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('printer_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('printer_id')->constrained()->cascadeOnDelete();
            $table->string('assignment_type');
            $table->foreignId('kitchen_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_type')->nullable();
            $table->string('station_label')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('priority')->default(1);
            $table->timestamps();
        });

        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('printer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('printer_assignment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('job_type');
            $table->string('status')->default('pending');
            $table->string('title');
            $table->json('payload')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('printed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
        Schema::dropIfExists('printer_assignments');
        Schema::dropIfExists('printers');
    }
};
