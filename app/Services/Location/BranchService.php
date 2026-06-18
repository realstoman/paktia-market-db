<?php

namespace App\Services\Location;

use App\Models\Branch;
use App\Services\Caching\CatalogCacheService;

class BranchService
{
    public function __construct(
        private readonly CatalogCacheService $catalogCacheService,
    ) {}

    public function create(array $data): Branch
    {
        $branch = Branch::create($data);
        $this->catalogCacheService->invalidateBranch($branch);

        return $branch;
    }

    public function update(Branch $branch, array $data): Branch
    {
        $branch->update($data);
        $this->catalogCacheService->invalidateBranch($branch);

        return $branch;
    }

    public function toggleActive(Branch $branch): Branch
    {
        $branch->update(['is_active' => ! $branch->is_active]);
        $this->catalogCacheService->invalidateBranch($branch);

        return $branch;
    }

    public function delete(Branch $branch): void
    {
        $branch->delete();
        $this->catalogCacheService->invalidateReferenceData();
    }

    public function getIndexData(): array
    {
        $branches = Branch::with(['country', 'province'])
            ->withCount(['floors', 'units'])
            ->latest()
            ->get();

        $branches->transform(function (Branch $branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'property_type' => $branch->property_type,
                'usage_type' => $branch->usage_type,
                'image_url' => $branch->image_url,
                'address' => $branch->address,
                'description' => $branch->description,
                'land_area_sqm' => $branch->land_area_sqm,
                'building_area_sqm' => $branch->building_area_sqm,
                'declared_floors' => $branch->declared_floors,
                'declared_units' => $branch->declared_units,
                'floors_count' => $branch->floors_count,
                'units_count' => $branch->units_count,
                'is_active' => $branch->is_active,
                'created_at' => $branch->created_at,
                'updated_at' => $branch->updated_at,
                'country' => $branch->country?->name,
                'country_id' => $branch->country_id,
                'country_object' => $branch->country,
                'province' => $branch->province?->name,
                'province_id' => $branch->province_id,
                'province_object' => $branch->province,
            ];
        });

        return [
            'branches' => $branches,
        ];
    }
}
