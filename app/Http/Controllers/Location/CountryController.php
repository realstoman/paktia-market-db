<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Inertia\Inertia;

class CountryController extends Controller
{
    public function index()
    {
        return Inertia::render('location/countries/index', [
            'countries' => Country::with('provinces')->get()
        ]);
    }
}
