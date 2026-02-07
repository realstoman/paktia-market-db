<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Auth\PermissionService;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function store(Request $request, PermissionService $service)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
        ]);

        $service->create($validated['name']);

        return redirect()->route('roles.index');
    }
}
