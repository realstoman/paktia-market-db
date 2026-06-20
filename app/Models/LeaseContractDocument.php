<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class LeaseContractDocument extends Model
{
    use Auditable;

    protected $fillable = [
        'lease_id',
        'contract_template_id',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'uploaded_by',
        'signed_at',
    ];

    protected function casts(): array
    {
        return ['signed_at' => 'datetime'];
    }

    public function lease()
    {
        return $this->belongsTo(Lease::class);
    }

    public function template()
    {
        return $this->belongsTo(ContractTemplate::class, 'contract_template_id');
    }
}
