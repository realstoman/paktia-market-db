<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tracks per-user read state for the derived notifications produced
        // by HandleInertiaRequests + the /api/notifications endpoint. The
        // notification ids are deterministic strings (e.g. "order-123-...")
        // so we can persist read state without owning a row per notification.
        Schema::create('notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('notification_id', 191);
            $table->timestamp('read_at')->useCurrent();

            $table->unique(['user_id', 'notification_id'], 'notification_reads_unique');
            $table->index('read_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_reads');
    }
};
