<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * @method bool can(string $ability, array $arguments = [])
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

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

    /**
     * Computed attributes for JSON responses.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'is_internal_user',
    ];

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
                || $this->branch_id !== null;
        });
    }
}
