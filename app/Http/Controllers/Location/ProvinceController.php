<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Province;
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

    public function byCountry(Country $country)
    {
        return $country->provinces()->select('id', 'name')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
        ]);

        Province::create($validated);

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Province created successfully.');
    }

    public function update(Request $request, Province $province)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
        ]);

        $province->update($validated);

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Province updated successfully.');
    }

    public function destroy(Request $request, Province $province)
    {
        $province->delete();

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Province deleted successfully.');
    }
}
