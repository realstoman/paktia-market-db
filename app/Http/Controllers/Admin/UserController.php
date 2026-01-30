<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use UserService;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/users/index', [
            'users' => User::with(['roles', 'country', 'province', 'branch'])->paginate(),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/create', [
            'roles' => Role::all(),
            'countries' => Country::all(),
        ]);
    }

    public function store(Request $request, UserService $service)
    {
        $service->create($request->all());
        return redirect()->route('users.index');
    }

    public function edit(User $user)
    {
        return Inertia::render('admin/users/edit', [
            'user' => $user->load(['roles', 'permissions']),
            'roles' => Role::all(),
            'countries' => Country::all(),
        ]);
    }

    public function update(Request $request, User $user, UserService $service)
    {
        $service->update($user, $request->all());
        return back();
    }

    public function block(User $user, UserService $service)
    {
        $service->toggleBlock($user);
        return back();
    }
}

