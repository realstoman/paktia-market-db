<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use Auditable;

    protected $fillable = [
        'branch_id',
        'vendor_id',
        'unit_id',
        'category_id',
        'inventory_type_id',
        'name',
        'description',
        'type',
        'unit',
        'quantity',
        'unit_price',
        'paid_amount',
        'currency_code',
        'currency_symbol',
        'receipt_path',
        'is_usable',
    ];

    protected $appends = [
        'total_price',
        'outstanding_amount',
        'receipt_url',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'is_usable' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function unitReference()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function categoryReference()
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function typeReference()
    {
        return $this->belongsTo(InventoryType::class, 'inventory_type_id');
    }

    public function images()
    {
        return $this->hasMany(InventoryItemImage::class)->orderBy('sort_order');
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class)->latest();
    }

    public function getTotalPriceAttribute(): float
    {
        return (float) $this->quantity * (float) $this->unit_price;
    }

    public function getOutstandingAmountAttribute(): float
    {
        return max(0, $this->total_price - (float) $this->paid_amount);
    }

    public function getReceiptUrlAttribute(): ?string
    {
        if (! $this->receipt_path) {
            return null;
        }

        if (str_starts_with($this->receipt_path, '/storage/')) {
            return $this->receipt_path;
        }

        if (str_starts_with($this->receipt_path, 'storage/')) {
            return '/'.$this->receipt_path;
        }

        if (str_starts_with($this->receipt_path, 'public/')) {
            return '/storage/'.str_replace('public/', '', $this->receipt_path);
        }

        return '/storage/'.$this->receipt_path;
    }
}
