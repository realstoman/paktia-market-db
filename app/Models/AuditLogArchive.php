<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLogArchive extends Model
{
    protected $fillable = [
        'period',
        'disk',
        'path',
        'records_count',
        'size_bytes',
        'checksum',
    ];

    protected function casts(): array
    {
        return [
            'records_count' => 'integer',
            'size_bytes' => 'integer',
        ];
    }
}
