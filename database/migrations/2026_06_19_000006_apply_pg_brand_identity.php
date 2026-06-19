<?php

use App\Services\Settings\SystemBrandingService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('system_settings')->upsert([
            ['key' => 'primary_color', 'value' => '#002452', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'secondary_color', 'value' => '#D3A450', 'created_at' => $now, 'updated_at' => $now],
        ], ['key'], ['value', 'updated_at']);

        Cache::forget(SystemBrandingService::CACHE_KEY);
    }

    public function down(): void
    {
        DB::table('system_settings')->where('key', 'primary_color')->update(['value' => '#0B5AA5']);
        DB::table('system_settings')->where('key', 'secondary_color')->update(['value' => '#F2A20C']);

        Cache::forget(SystemBrandingService::CACHE_KEY);
    }
};
