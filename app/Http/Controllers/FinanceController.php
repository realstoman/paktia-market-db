<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class FinanceController extends Controller
{
    public function index()
    {
        return Inertia::render('finance/index');
    }
}
