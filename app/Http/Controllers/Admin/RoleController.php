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
        $service->create($request->name, $request->permissions);
        return back();
    }
}
