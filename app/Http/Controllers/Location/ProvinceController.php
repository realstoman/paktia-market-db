<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Province;
use App\Services\Caching\CatalogCacheService;
use Illuminate\Http\Request;

class ProvinceController extends Controller
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

    public function byCountry(Country $country)
    {
        return $country->provinces()->select('id', 'name')->get();
    }

    public function store(Request $request, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
        ]);

        Province::create($validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Province created successfully.');
    }

    public function update(Request $request, Province $province, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
        ]);

        $province->update($validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Province updated successfully.');
    }

    public function destroy(Request $request, Province $province, CatalogCacheService $catalogCacheService)
    {
        $province->delete();
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Province deleted successfully.');
    }
}
