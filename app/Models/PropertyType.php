<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyType extends Model
{
    protected $fillable = [
        'key',
        'name',
        'name_translations',
        'behavior',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'name_translations' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PropertyType $type): void {
            if (($type->sort_order ?? 0) <= 0) {
                $type->sort_order = ((int) static::query()->max('sort_order')) + 1;
            }
        });
    }

    public function getNameAttribute(?string $value): string
    {
        $translations = $this->getAttribute('name_translations') ?? [];
        $locale = app()->getLocale();

        return filled($translations[$locale] ?? null)
            ? $translations[$locale]
            : (filled($translations['fa'] ?? null) ? $translations['fa'] : ($value ?? ''));
    }
}
