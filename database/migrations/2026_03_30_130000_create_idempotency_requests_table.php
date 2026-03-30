<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('idempotency_requests', function (Blueprint $table) {
            $table->id();
            $table->string('idempotency_key', 128);
            $table->string('scope', 128);
            $table->string('method', 16);
            $table->string('route', 128);
            $table->string('fingerprint', 64);
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_headers')->nullable();
            $table->longText('response_body')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['idempotency_key', 'scope', 'method', 'route'],
                'idempotency_requests_unique_key_scope_method_route'
            );
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_requests');
    }
};
