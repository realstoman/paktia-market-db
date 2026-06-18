<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Upgrade databases created before the property-domain migration.
        if (Schema::hasTable('branches') && ! Schema::hasTable('properties')) {
            Schema::rename('branches', 'properties');
        }

        if (Schema::hasTable('branch_sync_credentials') && ! Schema::hasTable('property_sync_credentials')) {
            Schema::rename('branch_sync_credentials', 'property_sync_credentials');
        }

        foreach ([
            'users', 'employees', 'inventory_items', 'expenses', 'finance_accounts',
            'finance_journals', 'finance_journal_lines', 'finance_account_mappings',
            'cash_movements', 'employee_advances', 'payroll_runs', 'employee_contracts',
            'audit_logs', 'property_floors', 'property_sync_credentials',
        ] as $tableName) {
            if (Schema::hasTable($tableName)
                && Schema::hasColumn($tableName, 'branch_id')
                && ! Schema::hasColumn($tableName, 'property_id')) {
                Schema::table($tableName, function (Blueprint $table): void {
                    $table->renameColumn('branch_id', 'property_id');
                });
            }
        }

        if (Schema::hasTable('properties') && ! Schema::hasColumn('properties', 'parent_property_id')) {
            Schema::table('properties', function (Blueprint $table): void {
                $table->foreignId('parent_property_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('properties')
                    ->nullOnDelete();
                $table->index(['parent_property_id', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('properties') && Schema::hasColumn('properties', 'parent_property_id')) {
            Schema::table('properties', function (Blueprint $table): void {
                $table->dropIndex(['parent_property_id', 'is_active']);
                $table->dropConstrainedForeignId('parent_property_id');
            });
        }
    }
};
