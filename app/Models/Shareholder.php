<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class Shareholder extends Model
{
    use Auditable {
        auditIgnoredAttributes as baseAuditIgnoredAttributes;
    }

    protected $fillable = [
        'full_name', 'father_name', 'grandfather_name', 'gender', 'date_of_birth',
        'country_of_birth_id', 'citizenship_country_id', 'nid_type', 'nid_number',
        'phone', 'whatsapp', 'email', 'occupation', 'address', 'photo_path',
        'notes', 'is_active',
    ];

    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date:Y-m-d', 'is_active' => 'boolean'];
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? asset('storage/'.$this->photo_path) : null;
    }

    public function countryOfBirth()
    {
        return $this->belongsTo(Country::class, 'country_of_birth_id');
    }

    public function citizenshipCountry()
    {
        return $this->belongsTo(Country::class, 'citizenship_country_id');
    }

    public function documents()
    {
        return $this->hasMany(ShareholderDocument::class)->latest();
    }

    public function shareholdings()
    {
        return $this->hasMany(PropertyShareholding::class)->latest('effective_from');
    }

    public function auditIgnoredAttributes(): array
    {
        return [...$this->baseAuditIgnoredAttributes(), 'nid_number'];
    }
}
