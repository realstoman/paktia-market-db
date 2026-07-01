<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use Auditable;

    protected $fillable = [
        'property_id',
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
        'assigned_quantity',
        'available_quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'is_usable' => 'boolean',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
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

    public function assignments()
    {
        return $this->hasMany(InventoryAssignment::class)->latest('assigned_at');
    }

    public function activeAssignments()
    {
        return $this->hasMany(InventoryAssignment::class)->whereNull('returned_at')->latest('assigned_at');
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

    public function getAssignedQuantityAttribute(): float
    {
        if ($this->relationLoaded('activeAssignments')) {
            return (float) $this->activeAssignments->sum('quantity');
        }

        return (float) $this->activeAssignments()->sum('quantity');
    }

    public function getAvailableQuantityAttribute(): float
    {
        return max(0, (float) $this->quantity - $this->assigned_quantity);
    }
}
