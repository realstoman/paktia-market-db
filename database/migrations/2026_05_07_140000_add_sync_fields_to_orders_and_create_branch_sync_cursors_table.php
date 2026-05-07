<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('sync_uuid')->nullable()->after('id');
            $table->string('sync_origin')->nullable()->after('source');
            $table->index('sync_uuid');
        });

        Schema::create('branch_sync_cursors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('direction');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'direction']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_sync_cursors');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['sync_uuid']);
            $table->dropColumn(['sync_uuid', 'sync_origin']);
        });
    }
};
