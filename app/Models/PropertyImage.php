<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyImage extends Model
{
    protected $fillable = [
        'property_id',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'sort_order',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        return asset('storage/'.$this->path);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
