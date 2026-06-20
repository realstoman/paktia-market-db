<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class RentPayment extends Model
{
    use Auditable;

    protected $fillable = [
        'lease_id',
        'tenant_id',
        'property_id',
        'currency_id',
        'receipt_number',
        'period_start',
        'period_end',
        'payment_date',
        'amount',
        'payment_method',
        'reference',
        'notes',
        'status',
        'created_by',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date:Y-m-d',
            'period_end' => 'date:Y-m-d',
            'payment_date' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'voided_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (RentPayment $payment): void {
            if (blank($payment->receipt_number)) {
                $next = ((int) self::query()->max('id')) + 1;
                $payment->receipt_number = sprintf('RNT-%s-%06d', now()->format('Y'), $next);
            }
        });
    }

    public function lease()
    {
        return $this->belongsTo(Lease::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
