<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('system_settings')->upsert([
            ['key' => 'primary_color', 'value' => '#0B5AA5', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'secondary_color', 'value' => '#F2A20C', 'created_at' => $now, 'updated_at' => $now],
        ], ['key'], ['value', 'updated_at']);
    }

    public function down(): void
    {
        DB::table('system_settings')->where('key', 'primary_color')->update(['value' => '#102F33']);
        DB::table('system_settings')->where('key', 'secondary_color')->update(['value' => '#CC924B']);
    }
};
