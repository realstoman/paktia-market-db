<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Lease extends Model
{
    use Auditable;

    protected $fillable = [
        'contract_number', 'tenant_id', 'property_id', 'property_floor_id',
        'property_unit_id', 'leased_space_type', 'start_date', 'end_date',
        'rent_amount', 'security_deposit', 'currency_id', 'payment_frequency',
        'status', 'terms', 'notes',
    ];

    protected static function booted(): void
    {
        static::creating(function (Lease $lease): void {
            if (blank($lease->contract_number)) {
                do {
                    $number = 'CTR-'.Str::upper(Str::random(10));
                } while (self::query()->where('contract_number', $number)->exists());

                $lease->contract_number = $number;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'rent_amount' => 'decimal:2',
            'security_deposit' => 'decimal:2',
        ];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function floor()
    {
        return $this->belongsTo(PropertyFloor::class, 'property_floor_id');
    }

    public function unit()
    {
        return $this->belongsTo(PropertyUnit::class, 'property_unit_id');
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function contractDocuments()
    {
        return $this->hasMany(LeaseContractDocument::class)->latest();
    }
}
