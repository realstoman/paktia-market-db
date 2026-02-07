<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Province;
use Illuminate\Http\Request;

class ProvinceController extends Controller
{
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

        return redirect()->route('countries.index')
            ->with('success', 'Province created successfully.');
    }

    public function update(Request $request, Province $province)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
        ]);

        $province->update($validated);

        return redirect()->route('countries.index')
            ->with('success', 'Province updated successfully.');
    }

    public function destroy(Province $province)
    {
        $province->delete();

        return redirect()->route('countries.index')
            ->with('success', 'Province deleted successfully.');
    }
}
