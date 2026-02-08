<?php

namespace App\Services\Location;

use App\Enums\KitchenType;
use App\Models\Branch;
use App\Models\Kitchen;
use Illuminate\Support\Str;

class KitchenService
{
    public function getIndexData(): array
    {
        $kitchens = Kitchen::with(['branches'])->get();

        $kitchens->transform(function (Kitchen $kitchen) {
            return [
                'id' => $kitchen->id,
                'name' => $kitchen->name,
                'type' => $kitchen->type,
                'is_active' => $kitchen->is_active,
                'branch_id' => $kitchen->branch_id,
                'branches' => $kitchen->branches,
                'created_at' => $kitchen->created_at,
                'updated_at' => $kitchen->updated_at,
            ];
        });

        return [
            'kitchens' => $kitchens,
            'branches' => Branch::orderBy('name')->get(),
            'kitchenTypes' => array_map(
                fn (KitchenType $type) => [
                    'label' => Str::title(str_replace('_', ' ', $type->value)),
                    'value' => $type->value,
                ],
                KitchenType::cases(),
            ),
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
