<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeContract extends Model
{
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'property_id',
        'contract_amount',
        'start_date',
        'end_date',
        'payment_plan_type',
        'installment_count',
        'status',
        'notes',
    ];

    protected $casts = [
        'contract_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(EmployeeContractPaymentSchedule::class);
    }
}
