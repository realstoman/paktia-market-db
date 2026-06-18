<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('new_values');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->text('url')->nullable()->after('user_agent');
            $table->string('method', 10)->nullable()->after('url');
            $table->uuid('batch_uuid')->nullable()->after('method');
            $table->foreignId('property_id')->nullable()->after('batch_uuid')
                ->constrained('properties')->nullOnDelete();
            $table->json('meta')->nullable()->after('property_id');

            $table->index('batch_uuid', 'audit_logs_batch_uuid_idx');
            $table->index(['user_id', 'created_at'], 'audit_logs_user_created_idx');
            $table->index(['auditable_type', 'auditable_id', 'created_at'], 'audit_logs_auditable_created_idx');
            $table->index(['property_id', 'created_at'], 'audit_logs_property_created_idx');
            $table->index(['action', 'created_at'], 'audit_logs_action_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('audit_logs_batch_uuid_idx');
            $table->dropIndex('audit_logs_user_created_idx');
            $table->dropIndex('audit_logs_auditable_created_idx');
            $table->dropIndex('audit_logs_property_created_idx');
            $table->dropIndex('audit_logs_action_created_idx');

            $table->dropConstrainedForeignId('property_id');
            $table->dropColumn([
                'ip_address',
                'user_agent',
                'url',
                'method',
                'batch_uuid',
                'meta',
            ]);
        });
    }
};
