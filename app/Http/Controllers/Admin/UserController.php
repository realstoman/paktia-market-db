<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Enums\PermissionEnum;
use App\Models\Country;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use App\Services\Auth\UserService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    use AuthorizesRequests;

    protected UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        // Parse query parameters for data-table
        $params = [
            'perPage' => $request->get('perPage', 10),
            'page' => $request->get('page', 1),
            'search' => $request->get('search', ''),
            'sort' => $this->parseSortParam($request->get('sort')),
            'filters' => $this->parseFilters($request),
        ];

        $usersPaginator = $this->userService->getPaginatedUsers($params);

        return Inertia::render('admin/users/index', [
            'users' => $usersPaginator->items(),
            'totalItems' => $usersPaginator->total(),
            'perPage' => (int)$params['perPage'],
            'page' => (int)$params['page'],
            'sort' => $params['sort'],
            'search' => $params['search'],
            'canCreate' => Auth::user()?->can(PermissionEnum::USER_CREATE->value),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/create', [
            'roles' => Role::all(),
            'countries' => Country::all(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'country_id' => 'nullable|exists:countries,id',
            'province_id' => 'nullable|exists:provinces,id',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $user = $this->userService->create($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('admin/users/edit', [
            'user' => $user->load(['roles', 'country', 'province', 'branch']),
            'roles' => Role::all(),
            'countries' => Country::all(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'country_id' => 'nullable|exists:countries,id',
            'province_id' => 'nullable|exists:provinces,id',
            'branch_id' => 'nullable|exists:branches,id',
            'blocked' => 'boolean',
        ]);

        // Remove password if empty
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $this->userService->update($user, $validated);

        return back()->with('success', 'User updated successfully.');
    }

    public function block(User $user)
    {
        $this->authorize('update', $user);

        $this->userService->toggleBlock($user);

        return back()->with('success', 'User status updated successfully.');
    }

    /**
     * Parse sort parameter from query string
     */
    private function parseSortParam($sortParam): array
    {
        if (empty($sortParam)) {
            return [];
        }

        try {
            $sortData = json_decode($sortParam, true);
            if (is_array($sortData)) {
                return $sortData;
            }
        } catch (\Exception $e) {
            // Invalid JSON, return empty array
        }

        return [];
    }

    /**
     * Parse filters from request
     */
    private function parseFilters(Request $request): array
    {
        $filters = [];
        $allParams = $request->all();

        // Exclude known parameters that aren't filters
        $excludeParams = ['perPage', 'page', 'search', 'sort'];

        foreach ($allParams as $key => $value) {
            if (!in_array($key, $excludeParams) && !empty($value)) {
                // Handle array values (like multi-select filters)
                if (str_contains($value, ',')) {
                    $filters[$key] = explode(',', $value);
                } else {
                    $filters[$key] = $value;
                }
            }
        }

        return $filters;
    }
}
