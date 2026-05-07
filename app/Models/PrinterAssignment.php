<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrinterAssignment extends Model
{
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'printer_id',
        'assignment_type',
        'kitchen_id',
        'order_type',
        'station_label',
        'is_active',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'priority' => 'integer',
        ];
    }

    public function printer()
    {
        return $this->belongsTo(Printer::class);
    }

    public function kitchen()
    {
        return $this->belongsTo(Kitchen::class);
    }
}
