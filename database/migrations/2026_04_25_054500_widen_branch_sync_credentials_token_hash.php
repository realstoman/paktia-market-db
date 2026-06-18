<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The HMAC-SHA256 hash is now stored prefixed (e.g. "hmac-sha256$<64-hex>"),
        // exceeding the original 64-character limit. Widen the column while
        // preserving the existing unique index by not redeclaring it here.
        Schema::table('property_sync_credentials', function (Blueprint $table) {
            $table->string('token_hash', 128)->change();
        });
    }

    public function down(): void
    {
        Schema::table('property_sync_credentials', function (Blueprint $table) {
            $table->string('token_hash', 64)->change();
        });
    }
};
