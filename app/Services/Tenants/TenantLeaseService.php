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
            $data['leased_space_type'] = match ($property->typeBehavior()) {
                'market' => $unit?->unit_type ?? 'property',
                'block' => $unit?->unit_type ?? 'block',
                'commercial_unit' => 'shop',
                'house' => 'house',
                default => $unit?->unit_type ?? 'property',
            };

            $lease = Lease::query()->create($data);

            if ($unit && $lease->status === 'active') {
                $unit->update(['occupancy_status' => 'occupied']);
            }

            if ($property->typeBehavior() === 'commercial_unit' && $lease->status === 'active') {
                $property->update(['operating_mode' => 'rented']);
            }

            return $lease;
        });
    }

    public function update(Lease $lease, array $data): Lease
    {
        return DB::transaction(function () use ($lease, $data): Lease {
            $oldUnitId = $lease->property_unit_id;
            $oldPropertyId = $lease->property_id;
            $property = Property::query()->findOrFail($data['property_id']);
            $unit = filled($data['property_unit_id'] ?? null)
                ? PropertyUnit::query()->with('floor')->findOrFail($data['property_unit_id'])
                : null;

            $this->validateTarget($property, $unit);
            $this->validateAvailability($property, $unit, $data, $lease->id);

            $data['property_floor_id'] = $unit?->property_floor_id;
            $data['property_unit_id'] = $unit?->id;
            $data['leased_space_type'] = match ($property->typeBehavior()) {
                'market' => $unit?->unit_type ?? 'property',
                'block' => $unit?->unit_type ?? 'block',
                'commercial_unit' => 'shop',
                'house' => 'house',
                default => $unit?->unit_type ?? 'property',
            };

            $lease->update($data);
            $lease->refresh();

            $this->refreshUnitOccupancy($oldUnitId);
            $this->refreshUnitOccupancy($lease->property_unit_id);
            $this->refreshCommercialUnitMode($oldPropertyId);
            $this->refreshCommercialUnitMode($lease->property_id);

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

        $behavior = $property->typeBehavior();

        if ($behavior === 'market') {
            if (! $unit) {
                throw ValidationException::withMessages([
                    'property_unit_id' => 'A shop or apartment must be selected for this property.',
                ]);
            }

            return;
        }

        if ($behavior === 'block') {
            return;
        }

        if ($behavior === 'house' && $unit) {
            throw ValidationException::withMessages([
                'property_unit_id' => 'A house is assigned as a complete property.',
            ]);
        }

        if ($behavior === 'commercial_unit' && $unit) {
            throw ValidationException::withMessages([
                'property_unit_id' => 'A commercial unit is assigned as one complete shop or office.',
            ]);
        }

    }

    private function validateAvailability(Property $property, ?PropertyUnit $unit, array $data, ?int $ignoreLeaseId = null): void
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
            ->when($ignoreLeaseId, fn ($query) => $query->whereKeyNot($ignoreLeaseId))
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

    private function refreshUnitOccupancy(?int $unitId): void
    {
        if (! $unitId) {
            return;
        }

        $occupied = Lease::query()
            ->where('property_unit_id', $unitId)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', today())
            ->where(fn ($period) => $period
                ->whereNull('end_date')
                ->orWhereDate('end_date', '>=', today()))
            ->exists();

        PropertyUnit::query()
            ->whereKey($unitId)
            ->update(['occupancy_status' => $occupied ? 'occupied' : 'vacant']);
    }

    private function refreshCommercialUnitMode(?int $propertyId): void
    {
        if (! $propertyId) {
            return;
        }

        $property = Property::query()->find($propertyId);

        if (! $property || $property->typeBehavior() !== 'commercial_unit') {
            return;
        }

        $occupied = Lease::query()
            ->where('property_id', $propertyId)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', today())
            ->where(fn ($period) => $period
                ->whereNull('end_date')
                ->orWhereDate('end_date', '>=', today()))
            ->exists();

        $property->update(['operating_mode' => $occupied ? 'rented' : 'vacant']);
    }
}
