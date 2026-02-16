<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'path',
        'sort_order',
    ];

    protected $appends = ['url'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getUrlAttribute(): string
    {
        if (str_starts_with($this->path, '/storage/')) {
            return $this->path;
        }

        if (str_starts_with($this->path, 'storage/')) {
            return '/'.$this->path;
        }

        if (str_starts_with($this->path, 'public/')) {
            return '/storage/'.str_replace('public/', '', $this->path);
        }

        return '/storage/'.$this->path;
    }
}
