<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        'title',
        'image_path',
        'link',
        'link_type',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): string
    {
        if (str_starts_with($this->image_path, '/storage/')) {
            return $this->image_path;
        }

        if (str_starts_with($this->image_path, 'storage/')) {
            return '/'.$this->image_path;
        }

        if (str_starts_with($this->image_path, 'public/')) {
            return '/storage/'.str_replace('public/', '', $this->image_path);
        }

        return '/storage/'.$this->image_path;
    }
}
