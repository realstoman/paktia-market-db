<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Services\Caching\CatalogCacheService;
use App\Services\Location\CountryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CountryController extends Controller
{
    private function redirectToToolbarOrigin(Request $request)
    {
        $referer = $request->headers->get('referer');

        if ($referer && ! str_contains($referer, '/tools/reference-data')) {
            return redirect()->to($referer);
        }

        return redirect()->route('countries.index');
    }

    private function toolbarResponse(Request $request, string $message)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
        }

        return $this->redirectToToolbarOrigin($request)->with('success', $message);
    }

    public function index(CountryService $service)
    {
        return Inertia::render('location/countries/index', [
            ...$service->getIndexData(),
        ]);
    }

    public function show(Country $country)
    {
        return Inertia::render('location/countries/show', [
            'country' => $country->load(['provinces', 'branches']),
        ]);
    }

    public function store(Request $request, CountryService $service, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:2|unique:countries,code',
            'currency_code' => 'required|string|size:3',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $service->create($validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Country created successfully.');
    }

    public function update(Request $request, CountryService $service, Country $country, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:2|unique:countries,code,' . $country->id,
            'currency_code' => 'required|string|size:3',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $service->update($country, $validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Country updated successfully.');
    }

    public function disable(CountryService $service, Country $country)
    {
        $service->toggleActive($country);

        $message = $country->is_active
            ? 'Country activated successfully.'
            : 'Country deactivated successfully.';

        return redirect()->back()
            ->with('success', $message);
    }

    public function destroy(Request $request, CountryService $service, Country $country, CatalogCacheService $catalogCacheService)
    {
        $service->delete($country);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Country deleted successfully.');
    }
}
