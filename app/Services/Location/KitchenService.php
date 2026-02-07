<?php

namespace App\Services\Location;

use App\Models\Branch;
use App\Models\Kitchen;

class KitchenService
{
    public function getIndexData(): array
    {
        $kitchens = Kitchen::with(['branch.country', 'branch.province'])->get();

        $kitchens->transform(function (Kitchen $kitchen) {
            return [
                'id' => $kitchen->id,
                'name' => $kitchen->name,
                'type' => $kitchen->type,
                'is_active' => $kitchen->is_active,
                'branch_id' => $kitchen->branch_id,
                'branch' => $kitchen->branch?->name,
                'country' => $kitchen->branch?->country?->name,
                'province' => $kitchen->branch?->province?->name,
                'created_at' => $kitchen->created_at,
                'updated_at' => $kitchen->updated_at,
            ];
        });

        return [
            'kitchens' => $kitchens,
            'branches' => Branch::orderBy('name')->get(),
        ];
    }

    public function create(array $data): Kitchen
    {
        return Kitchen::create($data);
    }

    public function update(Kitchen $kitchen, array $data): Kitchen
    {
        $kitchen->update($data);
        return $kitchen;
    }

    public function toggleActive(Kitchen $kitchen): Kitchen
    {
        $kitchen->update(['is_active' => ! $kitchen->is_active]);
        return $kitchen;
    }

    public function delete(Kitchen $kitchen): void
    {
        $kitchen->delete();
    }
}
