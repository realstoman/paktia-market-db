<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Auth\PermissionService;
use App\Services\Auth\RoleService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
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

    public function update(Request $request, RoleService $service, Role $role)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($role->id),
            ],
            'permissions' => ['array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ]);

        $service->update($role, $validated['name'], $validated['permissions'] ?? []);

        return redirect()->route('roles.index');
    }

    public function destroy(RoleService $service, Role $role)
    {
        $service->delete($role);

        return redirect()->route('roles.index');
    }
}
