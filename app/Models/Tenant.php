<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use Auditable {
        auditIgnoredAttributes as baseAuditIgnoredAttributes;
    }

    protected $fillable = [
        'card_code', 'tenant_type', 'full_name', 'father_name', 'business_name',
        'phone', 'whatsapp', 'email', 'nid_number', 'license_number', 'address',
        'photo_path', 'notes', 'is_active',
    ];

    protected $appends = ['photo_url'];

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant): void {
            if (blank($tenant->card_code)) {
                do {
                    $code = 'TEN-'.Str::upper(Str::random(10));
                } while (self::query()->where('card_code', $code)->exists());

                $tenant->card_code = $code;
            }
        });
    }

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? asset('storage/'.$this->photo_path) : null;
    }

    public function documents()
    {
        return $this->hasMany(TenantDocument::class)->latest();
    }

    public function leases()
    {
        return $this->hasMany(Lease::class)->latest('start_date');
    }

    public function currentLease()
    {
        return $this->hasOne(Lease::class)
            ->ofMany('start_date', 'max', fn ($query) => $query
                ->whereIn('status', ['active', 'draft'])
                ->whereDate('start_date', '<=', today())
                ->where(fn ($period) => $period
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', today())));
    }

    public function auditIgnoredAttributes(): array
    {
        return [...$this->baseAuditIgnoredAttributes(), 'nid_number'];
    }
}
