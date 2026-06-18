<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use Auditable;

    protected $fillable = [
        'property_id',
        'vendor_id',
        'title',
        'expense_type',
        'expense_category_id',
        'account_id',
        'paid_from_account_id',
        'amount',
        'payment_method',
        'description',
        'attachments',
        'expense_date',
        'approval_status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'amount' => 'decimal:2',
        'expense_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function expenseCategory()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function account()
    {
        return $this->belongsTo(FinanceAccount::class, 'account_id');
    }

    public function paidFromAccount()
    {
        return $this->belongsTo(FinanceAccount::class, 'paid_from_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
