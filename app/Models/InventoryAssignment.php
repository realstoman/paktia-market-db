<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAssignment extends Model
{
    use Auditable;

    protected $fillable = [
        'inventory_item_id',
        'employee_id',
        'quantity',
        'assigned_at',
        'expected_return_at',
        'returned_at',
        'condition_out',
        'condition_in',
        'notes',
        'assigned_by',
        'returned_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'assigned_at' => 'date',
        'expected_return_at' => 'date',
        'returned_at' => 'date',
    ];

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function returnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }
}
