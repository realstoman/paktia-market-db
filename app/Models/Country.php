<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $fillable = [
        'name',
        'name_translations',
        'code',
        'currency_code',
        'currency_symbol',
        'is_active',
    ];

    protected $appends = ['name_en'];

    protected function casts(): array
    {
        return [
            'name_translations' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function getNameAttribute(?string $value): string
    {
        $translations = $this->getAttribute('name_translations') ?? [];
        $locale = app()->getLocale();

        return filled($translations[$locale] ?? null)
            ? $translations[$locale]
            : (filled($translations['fa'] ?? null) ? $translations['fa'] : ($value ?? ''));
    }

    public function getNameEnAttribute(): string
    {
        return (string) ($this->getRawOriginal('name') ?? '');
    }

    public function provinces()
    {
        return $this->hasMany(Province::class)->orderBy('name');
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }
}
