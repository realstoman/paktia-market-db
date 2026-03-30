<?php

namespace App\Services\Location;

use App\Models\Branch;
use App\Models\BranchTable;
use App\Models\Kitchen;
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

    public function syncKitchens(Branch $branch, array $kitchenIds): void
    {
        $branch->kitchens()->sync($kitchenIds);
        $this->catalogCacheService->invalidateBranch($branch->load('kitchens'));
    }

    public function getIndexData(): array
    {
        $branches = Branch::with(['country', 'province', 'kitchens', 'tables'])->get();

        $branches->transform(function (Branch $branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'description' => $branch->description,
                'is_active' => $branch->is_active,
                'created_at' => $branch->created_at,
                'updated_at' => $branch->updated_at,
                'country' => $branch->country?->name,
                'country_id' => $branch->country_id,
                'country_object' => $branch->country,
                'province' => $branch->province?->name,
                'province_id' => $branch->province_id,
                'province_object' => $branch->province,
                'kitchens' => $branch->kitchens,
                'tables' => $branch->tables,
            ];
        });

        return [
            'branches' => $branches,
            'kitchens' => Kitchen::orderBy('name')->get(),
            'branchTables' => BranchTable::with('branch')
                ->orderBy('branch_id')
                ->orderBy('table_number')
                ->get(),
        ];
    }
}
