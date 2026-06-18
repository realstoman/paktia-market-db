<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShareholderDocument extends Model
{
    protected $fillable = [
        'shareholder_id', 'document_type', 'title', 'document_number',
        'expires_at', 'path', 'original_name', 'mime_type', 'size_bytes',
    ];

    protected function casts(): array
    {
        return ['expires_at' => 'date:Y-m-d'];
    }

    public function shareholder()
    {
        return $this->belongsTo(Shareholder::class);
    }
}
