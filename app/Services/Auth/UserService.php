<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
        if ($user->is_active) {
            $user->block();
        } else {
            $user->unblock();
        }
        return $user;
    }

    public function delete(User $user): void
    {
        $user->syncRoles([]);
        $user->delete();
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
                'branch:id,name',
                'kitchen:id,name',
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
            'role_ids' => $user->roles->pluck('id')->toArray(),
            'country' => $user->country ? $user->country->name : null,
            'country_id' => $user->country_id,
            'province' => $user->province ? $user->province->name : null,
            'province_id' => $user->province_id,
            'branch' => $user->branch ? $user->branch->name : null,
            'branch_id' => $user->branch_id,
            'kitchen' => $user->kitchen ? $user->kitchen->name : null,
            'kitchen_id' => $user->kitchen_id,
            'is_internal_user' => $user->is_internal_user,

            // Include full relationship objects if needed
            'country_object' => $user->country,
            'province_object' => $user->province,
            'branch_object' => $user->branch,
            'kitchen_object' => $user->kitchen,
        ];
    }
}
