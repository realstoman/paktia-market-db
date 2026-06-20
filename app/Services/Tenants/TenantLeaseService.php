<?php

namespace App\Services\Tenants;

use App\Models\Lease;
use App\Models\Property;
use App\Models\PropertyUnit;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TenantLeaseService
{
    public function create(array $data): Lease
    {
        return DB::transaction(function () use ($data): Lease {
            $property = Property::query()->findOrFail($data['property_id']);
            $unit = filled($data['property_unit_id'] ?? null)
                ? PropertyUnit::query()->with('floor')->findOrFail($data['property_unit_id'])
                : null;

            $this->validateTarget($property, $unit);
            $this->validateAvailability($property, $unit, $data);

            $data['property_floor_id'] = $unit?->property_floor_id;
            $data['property_unit_id'] = $unit?->id;
            $data['leased_space_type'] = match ($property->property_type) {
                'market', 'mall' => 'shop',
                'commercial_unit' => 'shop',
                'house' => 'house',
                'block' => $unit ? 'apartment' : 'block',
                default => $unit?->unit_type ?? 'property',
            };

            $lease = Lease::query()->create($data);

            if ($unit && $lease->status === 'active') {
                $unit->update(['occupancy_status' => 'occupied']);
            }

            if ($property->property_type === 'commercial_unit' && $lease->status === 'active') {
                $property->update(['operating_mode' => 'rented']);
            }

            return $lease;
        });
    }

    private function validateTarget(Property $property, ?PropertyUnit $unit): void
    {
        if ($unit && $unit->floor?->property_id !== $property->id) {
            throw ValidationException::withMessages([
                'property_unit_id' => 'The selected unit does not belong to this property.',
            ]);
        }

        if (in_array($property->property_type, ['market', 'mall'], true)) {
            if (! $unit || $unit->unit_type !== 'shop') {
                throw ValidationException::withMessages([
                    'property_unit_id' => 'A shop must be selected for a market or mall tenant.',
                ]);
            }

            return;
        }

        if ($property->property_type === 'house' && $unit) {
            throw ValidationException::withMessages([
                'property_unit_id' => 'A house is assigned as a complete property.',
            ]);
        }

        if ($property->property_type === 'commercial_unit' && $unit) {
            throw ValidationException::withMessages([
                'property_unit_id' => 'A commercial unit is assigned as one complete shop or office.',
            ]);
        }

        if ($property->property_type === 'block' && $unit && $unit->unit_type !== 'apartment') {
            throw ValidationException::withMessages([
                'property_unit_id' => 'Only an apartment may be selected inside a residential block.',
            ]);
        }
    }

    private function validateAvailability(Property $property, ?PropertyUnit $unit, array $data): void
    {
        $start = CarbonImmutable::parse($data['start_date']);
        $end = filled($data['end_date'] ?? null)
            ? CarbonImmutable::parse($data['end_date'])
            : CarbonImmutable::create(9999, 12, 31);

        if ($end->lt($start)) {
            throw ValidationException::withMessages([
                'end_date' => 'The lease end date must be on or after its start date.',
            ]);
        }

        $overlap = Lease::query()
            ->where('property_id', $property->id)
            ->whereIn('status', ['active', 'draft'])
            ->whereDate('start_date', '<=', $end)
            ->where(fn ($query) => $query
                ->whereNull('end_date')
                ->orWhereDate('end_date', '>=', $start))
            ->when(
                $unit,
                fn ($query) => $query->where(fn ($target) => $target
                    ->where('property_unit_id', $unit->id)
                    ->orWhereNull('property_unit_id')),
            )
            ->lockForUpdate()
            ->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'property_unit_id' => $unit
                    ? 'This shop or apartment is already assigned for the selected period.'
                    : 'This property already has an active assignment for the selected period.',
            ]);
        }
    }
}
