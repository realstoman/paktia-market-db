<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @method bool can(string $ability, array $arguments = [])
 */
class User extends Authenticatable
{
    use Auditable, HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'name',
        'email',
        'password',

        // Organization scope
        'country_id',
        'province_id',
        'branch_id',
        'kitchen_id',

        // Status
        'is_active',
    ];

    /**
     * Hidden attributes
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    // is_internal_user is intentionally NOT in $appends to keep the
    // default JSON shape minimal and avoid an extra roles() exists()
    // query on every serialization. Use AuthUserResource (or call
    // $user->is_internal_user explicitly) when the value is needed.

    /**
     * Attribute casting
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'blocked_at' => 'datetime',
        ];
    }

    /* ============================
    | Relationships
    |============================ */
    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function province()
    {
        return $this->belongsTo(Province::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function kitchen()
    {
        return $this->belongsTo(Kitchen::class);
    }

    /* ============================
    | User State Helpers
    |============================ */

    public function block(): void
    {
        $this->update([
            'is_active' => false,
            'blocked_at' => now(),
        ]);
    }

    public function unblock(): void
    {
        $this->update([
            'is_active' => true,
            'blocked_at' => null,
        ]);
    }

    public function isBlocked(): bool
    {
        return ! $this->is_active;
    }

    protected function isInternalUser(): Attribute
    {
        return Attribute::get(function (): bool {
            $hasRoles = $this->relationLoaded('roles')
                ? $this->roles->isNotEmpty()
                : $this->roles()->exists();

            return $hasRoles
                || $this->country_id !== null
                || $this->province_id !== null
                || $this->branch_id !== null
                || $this->kitchen_id !== null;
        });
    }
}
