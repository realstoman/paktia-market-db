<?php

namespace App\Services\Settings;

use App\Models\SystemSetting;
use App\Support\Performance\SchemaCache;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SystemBrandingService
{
    public const CACHE_KEY = 'system:branding:v1';
    public const CACHE_TTL_SECONDS = 86400; // 24h, also busted on update().

    /**
     * @return array<string, string>
     */
    public function getBranding(): array
    {
        // Branding is read on every Inertia request. Cache it for a day and
        // invalidate explicitly when settings are saved.
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function (): array {
            return $this->resolveBranding();
        });
    }

    /**
     * @return array<string, string>
     */
    private function resolveBranding(): array
    {
        if (! SchemaCache::hasTable('system_settings')) {
            return [
                'name' => $this->defaults()['restaurant_name'],
                'shortName' => $this->defaults()['restaurant_short_name'],
                'logoUrl' => '/brand/logo.svg',
                'logoFullUrl' => '/brand/logo-full.svg',
                'logoPath' => '',
                'logoFullPath' => '',
                'primaryColor' => $this->defaults()['primary_color'],
                'secondaryColor' => $this->defaults()['secondary_color'],
                'tertiaryColor' => $this->defaults()['tertiary_color'],
            ];
        }

        $settings = SystemSetting::query()
            ->whereIn('key', array_keys($this->defaults()))
            ->pluck('value', 'key');

        $branding = array_merge($this->defaults(), $settings->all());

        return [
            'name' => $branding['restaurant_name'],
            'shortName' => $branding['restaurant_short_name'],
            'logoUrl' => $this->resolveLogoUrl($branding['logo_path'], '/brand/logo.svg'),
            'logoFullUrl' => $this->resolveLogoUrl($branding['logo_full_path'], '/brand/logo-full.svg'),
            'logoPath' => $branding['logo_path'],
            'logoFullPath' => $branding['logo_full_path'],
            'primaryColor' => $branding['primary_color'],
            'secondaryColor' => $branding['secondary_color'],
            'tertiaryColor' => $branding['tertiary_color'],
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(array $data): void
    {
        $current = $this->getBranding();

        $payload = [
            'restaurant_name' => trim((string) ($data['restaurant_name'] ?? $current['name'])),
            'restaurant_short_name' => trim((string) ($data['restaurant_short_name'] ?? $current['shortName'])),
            'primary_color' => $this->normalizeHexColor((string) ($data['primary_color'] ?? $current['primaryColor'])),
            'secondary_color' => $this->normalizeHexColor((string) ($data['secondary_color'] ?? $current['secondaryColor'])),
            'tertiary_color' => $this->normalizeHexColor((string) ($data['tertiary_color'] ?? $current['tertiaryColor'])),
            'logo_path' => $this->storeLogo(
                file: $data['logo'] ?? null,
                currentPath: $current['logoPath'] ?: null,
                directory: 'branding',
            ) ?? ($current['logoPath'] ?: ''),
            'logo_full_path' => $this->storeLogo(
                file: $data['logo_full'] ?? null,
                currentPath: $current['logoFullPath'] ?: null,
                directory: 'branding',
            ) ?? ($current['logoFullPath'] ?: ''),
        ];

        foreach ($payload as $key => $value) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, string>
     */
    private function defaults(): array
    {
        return [
            'restaurant_name' => 'Paktia Market ERP',
            'restaurant_short_name' => 'Paktia Market',
            'logo_path' => '',
            'logo_full_path' => '',
            'primary_color' => '#102F33',
            'secondary_color' => '#CC924B',
            'tertiary_color' => '#F8FAFD',
        ];
    }

    private function resolveLogoUrl(?string $path, string $fallback): string
    {
        if ($path) {
            return Storage::url($path);
        }

        return $fallback;
    }

    private function normalizeHexColor(string $value): string
    {
        $normalized = strtoupper(trim($value));

        if (preg_match('/^#[0-9A-F]{6}$/', $normalized) === 1) {
            return $normalized;
        }

        return '#102F33';
    }

    private function storeLogo(
        mixed $file,
        ?string $currentPath,
        string $directory,
    ): ?string {
        if (! $file instanceof UploadedFile) {
            return null;
        }

        $newPath = $file->store($directory, 'public');

        if ($currentPath) {
            Storage::disk('public')->delete($currentPath);
        }

        return $newPath;
    }
}
