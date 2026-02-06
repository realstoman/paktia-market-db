<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Auth\PermissionService;
use App\Services\Auth\RoleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
class RoleController extends Controller
{
    public function index(PermissionService $service)
    {
        return Inertia::render('admin/roles/index', [
            ...$service->getRoleIndexData(),
        ]);
    }

    public function store(Request $request, RoleService $service)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ]);

        $service->create($validated['name'], $validated['permissions'] ?? []);

        return redirect()->route('roles.index');
    }
}
