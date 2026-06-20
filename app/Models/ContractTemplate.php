<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class ContractTemplate extends Model
{
    use Auditable;

    protected $fillable = [
        'property_id',
        'name',
        'contract_title',
        'intro_text',
        'logo_path',
        'landlord_organization',
        'representative_name',
        'representative_position',
        'representative_contact',
        'landlord_signature_label',
        'tenant_signature_label',
        'witness_signature_label',
        'footer_text',
        'is_default',
        'is_active',
    ];

    protected $appends = ['logo_url'];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? asset('storage/'.$this->logo_path) : null;
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function articles()
    {
        return $this->hasMany(ContractTemplateArticle::class)->orderBy('sort_order');
    }
}
