<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class AuthUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar ?? null,
            'is_active' => (bool) $user->is_active,
            'email_verified_at' => optional($user->email_verified_at)->toIso8601String(),
            'two_factor_enabled' => (bool) $user->two_factor_confirmed_at,
            'country_id' => $user->country_id,
            'province_id' => $user->province_id,
            'property_id' => $user->property_id,
            'is_internal_user' => (bool) $user->is_internal_user,
            'created_at' => optional($user->created_at)->toIso8601String(),
            'updated_at' => optional($user->updated_at)->toIso8601String(),
        ];
    }
}
