<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_log_archives', function (Blueprint $table) {
            $table->id();
            $table->string('period'); // YYYY-MM
            $table->string('disk');
            $table->string('path');
            $table->unsignedBigInteger('records_count')->default(0);
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('checksum', 64)->nullable();
            $table->timestamps();

            $table->unique(['period', 'disk'], 'audit_log_archives_period_disk_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log_archives');
    }
};
