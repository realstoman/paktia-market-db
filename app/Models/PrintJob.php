<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'printer_id',
        'printer_assignment_id',
        'branch_id',
        'requested_by',
        'job_type',
        'status',
        'title',
        'payload',
        'attempts',
        'last_error',
        'processed_at',
        'printed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
            'processed_at' => 'datetime',
            'printed_at' => 'datetime',
        ];
    }

    public function printer()
    {
        return $this->belongsTo(Printer::class);
    }

    public function assignment()
    {
        return $this->belongsTo(PrinterAssignment::class, 'printer_assignment_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
