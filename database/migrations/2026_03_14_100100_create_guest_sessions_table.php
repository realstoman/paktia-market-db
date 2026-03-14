<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('token')->unique();
            $table->string('device_id')->nullable()->index();
            $table->string('platform')->nullable();
            $table->string('app_version')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('merged_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_sessions');
    }
};
