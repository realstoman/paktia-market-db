<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    protected $fillable = [
        'name',
        'pashto_name',
        'dari_name',
        'description',
        'pashto_description',
        'dari_description',
        'image_path',
    ];

    protected $appends = ['image_url'];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

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
