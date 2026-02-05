<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index()
    {
        return Inertia::render('location/branches/index', [
            'branches' => Branch::with('province')->get()
        ]);
    }
}
