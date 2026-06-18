<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PropertyShareholding extends Model
{
    use Auditable;

    protected $fillable = [
        'property_id', 'shareholder_id', 'percentage', 'capital_contribution',
        'currency_id', 'effective_from', 'effective_to', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:4',
            'capital_contribution' => 'decimal:2',
            'effective_from' => 'date:Y-m-d',
            'effective_to' => 'date:Y-m-d',
        ];
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function shareholder()
    {
        return $this->belongsTo(Shareholder::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function scopeEffectiveDuring(Builder $query, string $from, string $to): Builder
    {
        return $query
            ->whereDate('effective_from', '<=', $to)
            ->where(fn (Builder $period) => $period
                ->whereNull('effective_to')
                ->orWhereDate('effective_to', '>=', $from));
    }

    public function allocatedAmount(float $netProfitOrLoss): float
    {
        return round($netProfitOrLoss * ((float) $this->percentage / 100), 2);
    }
}
