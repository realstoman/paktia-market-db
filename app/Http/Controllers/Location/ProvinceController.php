<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;

class ProvinceController extends Controller
{
    public function byCountry(Country $country)
{
    return $country->provinces()->select('id', 'name')->get();
}
}
