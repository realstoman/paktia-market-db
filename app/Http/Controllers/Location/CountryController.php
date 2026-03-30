<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
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

    public function store(Request $request, CountryService $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:2|unique:countries,code',
            'currency_code' => 'required|string|size:3',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $service->create($validated);

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Country created successfully.');
    }

    public function update(Request $request, CountryService $service, Country $country)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:2|unique:countries,code,' . $country->id,
            'currency_code' => 'required|string|size:3',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $service->update($country, $validated);

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Country updated successfully.');
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

    public function destroy(Request $request, CountryService $service, Country $country)
    {
        $service->delete($country);

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Country deleted successfully.');
    }
}
