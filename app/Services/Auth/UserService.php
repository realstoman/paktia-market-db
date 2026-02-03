<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function create(array $data): User
    {
        $user = User::create($data);
        $user->syncRoles($data['roles'] ?? []);
        return $user;
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        $user->syncRoles($data['roles'] ?? []);
        return $user;
    }

    public function toggleBlock(User $user): User
    {
        $user->blocked = !$user->blocked;
        $user->save();
        return $user;
    }

    /**
     * Get paginated users with filters, sorting, and search
     */
    public function getPaginatedUsers(array $params = []): LengthAwarePaginator
    {
        $perPage = $params['perPage'] ?? 10;
        $page = $params['page'] ?? 1;
        $sort = $params['sort'] ?? [];
        $search = $params['search'] ?? '';
        $filters = $params['filters'] ?? [];

        $query = User::query()
            ->with([
                'roles:name,id',
                'country:id,name',
                'province:id,name',
                'branch:id,name'
            ]);

        // Apply search
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhereHas('roles', function ($roleQuery) use ($search) {
                      $roleQuery->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        // Apply filters
        foreach ($filters as $column => $value) {
            if (!empty($value)) {
                $this->applyFilter($query, $column, $value);
            }
        }

        // Apply sorting
        if (!empty($sort)) {
            foreach ($sort as $sortItem) {
                if (isset($sortItem['id']) && isset($sortItem['desc'])) {
                    $this->applySorting($query, $sortItem['id'], $sortItem['desc']);
                }
            }
        } else {
            // Default sorting
            $query->orderBy('created_at', 'desc');
        }

        // Get paginated results
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Transform the paginator items to include relationship data
        $paginator->getCollection()->transform(function ($user) {
            return $this->transformUser($user);
        });

        return $paginator;
    }

    /**
     * Transform user to include relationship names
     */
    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'blocked_at' => $user->blocked_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,

            // Relationships
            'roles' => $user->roles->pluck('name')->toArray(),
            'country' => $user->country ? $user->country->name : null,
            'country_id' => $user->country_id,
            'province' => $user->province ? $user->province->name : null,
            'province_id' => $user->province_id,
            'branch' => $user->branch ? $user->branch->name : null,
            'branch_id' => $user->branch_id,

            // Include full relationship objects if needed
            'country_object' => $user->country,
            'province_object' => $user->province,
            'branch_object' => $user->branch,
        ];
    }

    /**
     * Apply filter to query
     */
    private function applyFilter(Builder $query, string $column, $value): void
    {
        switch ($column) {
            case 'name':
            case 'email':
                $query->where($column, 'like', '%' . $value . '%');
                break;

            case 'roles':
                if (is_array($value)) {
                    $query->whereHas('roles', function ($roleQuery) use ($value) {
                        $roleQuery->whereIn('name', $value);
                    });
                }
                break;

            case 'created_at':
                // Handle date range filter
                if (is_array($value) && count($value) === 2) {
                    $query->whereBetween('created_at', $value);
                }
                break;

            case 'is_active':
                $query->where('is_active', $value);
                break;

            case 'country_id':
            case 'province_id':
            case 'branch_id':
                $query->where($column, $value);
                break;
        }
    }

    /**
     * Apply sorting to query
     */
    private function applySorting(Builder $query, string $column, bool $descending): void
    {
        $direction = $descending ? 'desc' : 'asc';

        switch ($column) {
            case 'name':
            case 'email':
            case 'created_at':
            case 'updated_at':
            case 'is_active':
            case 'country_id':
            case 'province_id':
            case 'branch_id':
                $query->orderBy($column, $direction);
                break;

            case 'roles':
                // Sort by first role name
                $query->leftJoin('model_has_roles', function ($join) {
                    $join->on('users.id', '=', 'model_has_roles.model_id')
                         ->where('model_has_roles.model_type', '=', User::class);
                })
                ->leftJoin('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->select('users.*', DB::raw('MIN(roles.name) as first_role_name'))
                ->groupBy('users.id')
                ->orderBy('first_role_name', $direction);
                break;

            case 'country':
            case 'province':
            case 'branch':
                // Sort by relationship name
                $relationship = $column;
                $query->leftJoin($relationship . 's', 'users.' . $column . '_id', '=', $relationship . 's.id')
                      ->orderBy($relationship . 's.name', $direction);
                break;
        }
    }
}
