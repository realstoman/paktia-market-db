<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Province;
use App\Services\Caching\CatalogCacheService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
        return $country->provinces()
            ->select('id', 'country_id', 'name', 'name_translations')
            ->get();
    }

    public function store(Request $request, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
            'name_fa' => 'required|string|max:255',
            'name_ps' => 'required|string|max:255',
        ]);

        Province::create($this->prepareLocalizedName($validated));
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, __('locations.provinces.created'));
    }

    public function update(Request $request, Province $province, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('provinces', 'name')
                    ->where('country_id', $request->integer('country_id'))
                    ->ignore($province),
            ],
            'name_fa' => 'required|string|max:255',
            'name_ps' => 'required|string|max:255',
        ]);

        $province->update($this->prepareLocalizedName($validated));
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, __('locations.provinces.updated'));
    }

    public function destroy(Request $request, Province $province, CatalogCacheService $catalogCacheService)
    {
        $province->delete();
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, __('locations.provinces.deleted'));
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
