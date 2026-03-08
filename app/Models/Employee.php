<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'employment_type_id',
        'employee_position_id',
        'shift_id',
        'first_name',
        'last_name',
        'phone',
        'address',
        'description',
        'profile_picture',
        'attachments',
        'salary',
        'salary_currency',
        'status',
        'is_active',
    ];

    protected $casts = [
        'attachments' => 'array',
        'salary' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function employmentType()
    {
        return $this->belongsTo(EmploymentType::class);
    }

    public function employeePosition()
    {
        return $this->belongsTo(EmployeePosition::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
