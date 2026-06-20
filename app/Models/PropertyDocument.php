<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class PropertyDocument extends Model
{
    use Auditable;

    protected $fillable = [
        'property_id',
        'document_type',
        'title',
        'document_number',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
