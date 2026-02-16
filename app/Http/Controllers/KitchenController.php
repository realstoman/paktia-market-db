<?php
namespace App\Http\Controllers;

use App\Enums\KitchenType;
use App\Models\Kitchen;
use App\Services\Location\KitchenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class KitchenController extends Controller
{
    public function index(KitchenService $service)
    {
        return Inertia::render('location/kitchens/index', [
            ...$service->getIndexData(),
        ]);
    }

    public function show(Kitchen $kitchen)
    {
        return Inertia::render('location/kitchens/show', [
            'kitchen' => $kitchen->load(['branches']),
        ]);
    }

    public function store(Request $request, KitchenService $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::enum(KitchenType::class)],
        ]);

        $service->create($validated);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen created successfully.');
    }

    public function update(Request $request, KitchenService $service, Kitchen $kitchen)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::enum(KitchenType::class)],
        ]);

        $service->update($kitchen, $validated);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen updated successfully.');
    }

    public function toggle(KitchenService $service, Kitchen $kitchen)
    {
        $service->toggleActive($kitchen);

        $message = $kitchen->is_active
            ? 'Kitchen activated successfully.'
            : 'Kitchen deactivated successfully.';

        return redirect()->route('kitchens.index')
            ->with('success', $message);
    }

    public function destroy(KitchenService $service, Kitchen $kitchen)
    {
        $service->delete($kitchen);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen deleted successfully.');
    }

    public function syncProducts(Request $request, Kitchen $kitchen)
    {
        $validated = $request->validate([
            'products' => ['array'],
            'products.*' => ['integer', 'exists:products,id'],
        ]);

        $productIds = $validated['products'] ?? [];

        DB::transaction(function () use ($kitchen, $productIds) {
            DB::table('products')
                ->where('kitchen_id', $kitchen->id)
                ->whereNotIn('id', $productIds)
                ->update(['kitchen_id' => null, 'updated_at' => now()]);

            if (!empty($productIds)) {
                DB::table('products')
                    ->whereIn('id', $productIds)
                    ->update(['kitchen_id' => $kitchen->id, 'updated_at' => now()]);
            }
        });

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen products updated successfully.');
    }
}
