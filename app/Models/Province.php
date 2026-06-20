<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $fillable = [
        'country_id',
        'name',
        'name_translations',
    ];

    protected $appends = ['name_en'];

    protected function casts(): array
    {
        return [
            'name_translations' => 'array',
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

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }
}
