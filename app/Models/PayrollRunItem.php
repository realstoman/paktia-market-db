<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollRunItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'salary_type',
        'gross_salary',
        'bonuses',
        'deductions',
        'advances_deducted',
        'overtime_amount',
        'net_salary',
        'payment_method',
        'payment_status',
        'payment_date',
        'covered_period_dates',
        'covered_month_count',
    ];

    protected $casts = [
        'gross_salary' => 'decimal:2',
        'bonuses' => 'decimal:2',
        'deductions' => 'decimal:2',
        'advances_deducted' => 'decimal:2',
        'overtime_amount' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'payment_date' => 'date',
        'covered_period_dates' => 'array',
        'covered_month_count' => 'integer',
    ];

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
