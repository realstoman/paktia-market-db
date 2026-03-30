<?php
namespace App\Http\Controllers;

use App\Models\Cuisine;
use App\Models\Kitchen;
use App\Models\KitchenCategory;
use App\Models\KitchenType;
use App\Services\Caching\CatalogCacheService;
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
        $kitchen->load(['branches', 'kitchenType', 'cuisines', 'kitchenCategories']);

        return Inertia::render('location/kitchens/show', [
            'kitchen' => [
                'id' => $kitchen->id,
                'name' => $kitchen->name,
                'type' => $kitchen->kitchenType?->name,
                'kitchen_type' => $kitchen->kitchenType?->name,
                'kitchen_type_id' => $kitchen->kitchen_type_id,
                'cuisines' => $kitchen->cuisines->map(fn (Cuisine $cuisine) => [
                    'id' => $cuisine->id,
                    'name' => $cuisine->name,
                    'description' => $cuisine->description,
                ])->values(),
                'cuisines_label' => $kitchen->cuisines->pluck('name')->join(', '),
                'kitchen_categories' => $kitchen->kitchenCategories->map(fn (KitchenCategory $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                ])->values(),
                'kitchen_categories_label' => $kitchen->kitchenCategories->pluck('name')->join(', '),
                'branch_id' => $kitchen->branch_id,
                'branches' => $kitchen->branches,
                'is_active' => $kitchen->is_active,
                'created_at' => $kitchen->created_at,
                'updated_at' => $kitchen->updated_at,
            ],
        ]);
    }

    public function store(Request $request, KitchenService $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'kitchen_type_id' => ['nullable', 'exists:kitchen_types,id'],
            'cuisines' => ['nullable', 'array'],
            'cuisines.*' => ['integer', 'exists:cuisines,id'],
            'kitchen_categories' => ['nullable', 'array'],
            'kitchen_categories.*' => ['integer', 'exists:kitchen_categories,id'],
        ]);

        $service->create($validated);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen created successfully.');
    }

    public function update(Request $request, KitchenService $service, Kitchen $kitchen)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'kitchen_type_id' => ['nullable', 'exists:kitchen_types,id'],
            'cuisines' => ['nullable', 'array'],
            'cuisines.*' => ['integer', 'exists:cuisines,id'],
            'kitchen_categories' => ['nullable', 'array'],
            'kitchen_categories.*' => ['integer', 'exists:kitchen_categories,id'],
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

    public function syncProducts(Request $request, Kitchen $kitchen, CatalogCacheService $catalogCacheService)
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

        $catalogCacheService->invalidateKitchen($kitchen);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen products updated successfully.');
    }

    public function storeKitchenType(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:kitchen_types,name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        KitchenType::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen type created successfully.');
    }

    public function updateKitchenType(Request $request, KitchenType $kitchenType)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('kitchen_types', 'name')->ignore($kitchenType->id)],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $kitchenType->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen type updated successfully.');
    }

    public function destroyKitchenType(KitchenType $kitchenType)
    {
        if ($kitchenType->kitchens()->exists()) {
            return back()->withErrors([
                'kitchen_type' => 'This kitchen type is currently assigned to kitchens and cannot be deleted.',
            ]);
        }

        $kitchenType->delete();

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen type deleted successfully.');
    }

    public function storeCuisine(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:cuisines,name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        Cuisine::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->route('kitchens.index')
            ->with('success', 'Cuisine created successfully.');
    }

    public function updateCuisine(Request $request, Cuisine $cuisine)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('cuisines', 'name')->ignore($cuisine->id)],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $cuisine->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->route('kitchens.index')
            ->with('success', 'Cuisine updated successfully.');
    }

    public function destroyCuisine(Cuisine $cuisine)
    {
        if ($cuisine->kitchens()->exists()) {
            return back()->withErrors([
                'cuisine' => 'This cuisine is assigned to kitchens and cannot be deleted.',
            ]);
        }

        $cuisine->delete();

        return redirect()->route('kitchens.index')
            ->with('success', 'Cuisine deleted successfully.');
    }

    public function storeKitchenCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:kitchen_categories,name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        KitchenCategory::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen category created successfully.');
    }

    public function updateKitchenCategory(Request $request, KitchenCategory $kitchenCategory)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('kitchen_categories', 'name')->ignore($kitchenCategory->id)],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $kitchenCategory->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen category updated successfully.');
    }

    public function destroyKitchenCategory(KitchenCategory $kitchenCategory)
    {
        if ($kitchenCategory->kitchens()->exists()) {
            return back()->withErrors([
                'kitchen_category' => 'This kitchen category is assigned to kitchens and cannot be deleted.',
            ]);
        }

        $kitchenCategory->delete();

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen category deleted successfully.');
    }
}
