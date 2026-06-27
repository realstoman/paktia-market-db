<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessFinanceEntry extends Model
{
    use Auditable;

    protected $fillable = [
        'business_key',
        'entry_date',
        'currency_code',
        'valuation',
        'sales',
        'income',
        'expenses',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'valuation' => 'decimal:2',
        'sales' => 'decimal:2',
        'income' => 'decimal:2',
        'expenses' => 'decimal:2',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
