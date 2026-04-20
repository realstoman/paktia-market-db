<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use Auditable;

    protected $fillable = [
        'key',
        'value',
    ];
}
