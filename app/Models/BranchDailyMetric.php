<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchDailyMetric extends Model
{
    protected $fillable = [
        'branch_id',
        'metric_date',
        'orders_total',
        'completed_orders_total',
        'cancelled_orders_total',
        'gross_sales_total',
        'completed_sales_total',
        'expenses_total',
        'last_projected_at',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'gross_sales_total' => 'decimal:2',
        'completed_sales_total' => 'decimal:2',
        'expenses_total' => 'decimal:2',
        'last_projected_at' => 'datetime',
    ];
}
