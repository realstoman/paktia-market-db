<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Printer extends Model
{
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'ip_address',
        'port',
        'connection_type',
        'paper_width',
        'copies',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'port' => 'integer',
            'copies' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignments()
    {
        return $this->hasMany(PrinterAssignment::class);
    }

    public function printJobs()
    {
        return $this->hasMany(PrintJob::class);
    }
}
