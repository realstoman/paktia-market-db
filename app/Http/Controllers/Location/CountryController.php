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
            'country' => $country->load(['provinces', 'properties']),
        ]);
    }

    public function store(Request $request, CountryService $service, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_fa' => 'required|string|max:255',
            'name_ps' => 'required|string|max:255',
            'code' => 'required|string|size:2|unique:countries,code',
            'currency_code' => 'required|string|size:3',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $service->create($this->prepareLocalizedName($validated));
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, __('locations.countries.created'));
    }

    public function update(Request $request, CountryService $service, Country $country, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_fa' => 'required|string|max:255',
            'name_ps' => 'required|string|max:255',
            'code' => 'required|string|size:2|unique:countries,code,'.$country->id,
            'currency_code' => 'required|string|size:3',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $service->update($country, $this->prepareLocalizedName($validated));
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, __('locations.countries.updated'));
    }

    public function disable(CountryService $service, Country $country)
    {
        $service->toggleActive($country);

        $message = $country->is_active
            ? __('locations.countries.activated')
            : __('locations.countries.deactivated');

        return redirect()->back()
            ->with('success', $message);
    }

    public function destroy(Request $request, CountryService $service, Country $country, CatalogCacheService $catalogCacheService)
    {
        $service->delete($country);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, __('locations.countries.deleted'));
    }

    private function prepareLocalizedName(array $validated): array
    {
        $validated['name_translations'] = [
            'en' => $validated['name'],
            'fa' => $validated['name_fa'],
            'ps' => $validated['name_ps'],
        ];

        unset($validated['name_fa'], $validated['name_ps']);

        return $validated;
    }
}
