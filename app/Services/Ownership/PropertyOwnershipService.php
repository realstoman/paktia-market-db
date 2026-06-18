<?php

namespace App\Services\Ownership;

use App\Models\PropertyShareholding;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PropertyOwnershipService
{
    public function assign(array $data): PropertyShareholding
    {
        return DB::transaction(function () use ($data): PropertyShareholding {
            $start = CarbonImmutable::parse($data['effective_from'])->startOfDay();
            $end = filled($data['effective_to'] ?? null)
                ? CarbonImmutable::parse($data['effective_to'])->startOfDay()
                : CarbonImmutable::create(9999, 12, 31)->startOfDay();

            if ($end->lt($start)) {
                throw ValidationException::withMessages([
                    'effective_to' => 'The ownership end date must be on or after its start date.',
                ]);
            }

            $overlapping = PropertyShareholding::query()
                ->where('property_id', $data['property_id'])
                ->whereDate('effective_from', '<=', $end)
                ->where(function ($query) use ($start): void {
                    $query->whereNull('effective_to')
                        ->orWhereDate('effective_to', '>=', $start);
                })
                ->lockForUpdate()
                ->get();

            if ($overlapping->contains('shareholder_id', (int) $data['shareholder_id'])) {
                throw ValidationException::withMessages([
                    'shareholder_id' => 'This shareholder already has an overlapping assignment for the property.',
                ]);
            }

            $boundaries = collect([$start])
                ->merge($overlapping->flatMap(function (PropertyShareholding $holding) use ($start, $end) {
                    $dates = [CarbonImmutable::parse($holding->effective_from)];
                    if ($holding->effective_to) {
                        $dates[] = CarbonImmutable::parse($holding->effective_to)->addDay();
                    }

                    return collect($dates)->filter(fn (CarbonImmutable $date) => $date->betweenIncluded($start, $end));
                }))
                ->unique(fn (CarbonImmutable $date) => $date->toDateString());

            foreach ($boundaries as $date) {
                $existingPercentage = $overlapping
                    ->filter(fn (PropertyShareholding $holding) =>
                        CarbonImmutable::parse($holding->effective_from)->lte($date)
                        && (! $holding->effective_to || CarbonImmutable::parse($holding->effective_to)->gte($date)))
                    ->sum(fn (PropertyShareholding $holding) => (float) $holding->percentage);

                if ($existingPercentage + (float) $data['percentage'] > 100.00001) {
                    throw ValidationException::withMessages([
                        'percentage' => 'Property ownership cannot exceed 100% during any part of the selected period.',
                    ]);
                }
            }

            return PropertyShareholding::query()->create($data);
        });
    }

    public function close(PropertyShareholding $shareholding, string $effectiveTo): PropertyShareholding
    {
        $end = CarbonImmutable::parse($effectiveTo);
        if ($end->lt(CarbonImmutable::parse($shareholding->effective_from))) {
            throw ValidationException::withMessages([
                'effective_to' => 'The ownership end date must be on or after its start date.',
            ]);
        }

        $shareholding->update(['effective_to' => $end->toDateString()]);

        return $shareholding->refresh();
    }
}
