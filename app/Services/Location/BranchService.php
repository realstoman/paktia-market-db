<?php

namespace App\Services\Location;

use App\Models\Branch;
use App\Models\BranchTable;
use App\Models\Kitchen;

class BranchService
{
    public function create(array $data): Branch
    {
        return Branch::create($data);
    }

    public function update(Branch $branch, array $data): Branch
    {
        $branch->update($data);
        return $branch;
    }

    public function toggleActive(Branch $branch): Branch
    {
        $branch->update(['is_active' => ! $branch->is_active]);
        return $branch;
    }

    public function delete(Branch $branch): void
    {
        $branch->delete();
    }

    public function syncKitchens(Branch $branch, array $kitchenIds): void
    {
        $branch->kitchens()->sync($kitchenIds);
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
