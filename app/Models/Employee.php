<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'user_id',
        'property_id',
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
        'contract_start_date',
        'contract_end_date',
        'contract_amount',
        'status',
        'is_active',
    ];

    protected $casts = [
        'attachments' => 'array',
        'salary' => 'decimal:2',
        'contract_amount' => 'decimal:2',
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
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

    public function advances(): HasMany
    {
        return $this->hasMany(EmployeeAdvance::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(EmployeeContract::class);
    }

    public function inventoryAssignments(): HasMany
    {
        return $this->hasMany(InventoryAssignment::class);
    }
}
