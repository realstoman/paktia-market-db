<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantDocument extends Model
{
    protected $fillable = [
        'tenant_id', 'document_type', 'title', 'document_number', 'expires_at',
        'path', 'original_name', 'mime_type', 'size_bytes',
    ];

    protected $hidden = ['path'];

    protected function casts(): array
    {
        return ['expires_at' => 'date:Y-m-d'];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
