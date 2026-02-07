<?php
namespace App\Http\Controllers;

use App\Models\Kitchen;
use App\Services\Location\KitchenService;
use Illuminate\Http\Request;
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
            'kitchen' => $kitchen->load(['branch.country', 'branch.province']),
        ]);
    }

    public function store(Request $request, KitchenService $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'type' => 'nullable|string|max:255',
        ]);

        $service->create($validated);

        return redirect()->route('kitchens.index')
            ->with('success', 'Kitchen created successfully.');
    }

    public function update(Request $request, KitchenService $service, Kitchen $kitchen)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'type' => 'nullable|string|max:255',
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
}
