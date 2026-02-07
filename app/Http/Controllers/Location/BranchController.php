<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Province;
use App\Services\Location\BranchService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(BranchService $service)
    {
        return Inertia::render('location/branches/index', [
            ...$service->getIndexData(),
            'countries' => Country::orderBy('name')->get(),
            'provinces' => Province::orderBy('name')->get(),
        ]);
    }

    public function show(Branch $branch)
    {
        return Inertia::render('location/branches/show', [
            'branch' => $branch->load(['country', 'province', 'kitchens']),
        ]);
    }

    public function update(Request $request, BranchService $service, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'country_id' => 'required|exists:countries,id',
            'province_id' => 'required|exists:provinces,id',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $service->update($branch, $validated);

        return redirect()->route('branches.index')
            ->with('success', 'Branch updated successfully.');
    }

    public function disable(BranchService $service, Branch $branch)
    {
        $service->disable($branch);

        return redirect()->route('branches.index')
            ->with('success', 'Branch disabled successfully.');
    }

    public function destroy(BranchService $service, Branch $branch)
    {
        $service->delete($branch);

        return redirect()->route('branches.index')
            ->with('success', 'Branch deleted successfully.');
    }
}
