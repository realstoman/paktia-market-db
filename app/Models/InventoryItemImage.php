<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItemImage extends Model
{
    protected $fillable = [
        'inventory_item_id',
        'path',
        'sort_order',
    ];

    protected $appends = ['url'];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
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
