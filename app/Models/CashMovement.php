<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashMovement extends Model
{
    use Auditable;

    protected $fillable = [
        'property_id',
        'movement_type',
        'direction',
        'movement_date',
        'amount',
        'payment_method',
        'account_id',
        'counterparty_account_id',
        'reference_type',
        'reference_id',
        'created_by',
        'approved_by',
        'approval_status',
        'description',
        'attachment_path',
    ];

    protected $casts = [
        'movement_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'account_id');
    }

    public function counterpartyAccount(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'counterparty_account_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
