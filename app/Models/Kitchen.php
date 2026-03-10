<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kitchen extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'type',
        'kitchen_type_id',
        'is_active',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function branches()
    {
        return $this->belongsToMany(Branch::class)->withTimestamps();
    }

    public function kitchenType()
    {
        return $this->belongsTo(KitchenType::class);
    }

    public function cuisines()
    {
        return $this->belongsToMany(Cuisine::class)->withTimestamps();
    }

    public function kitchenCategories()
    {
        return $this->belongsToMany(
            KitchenCategory::class,
            'kitchen_category_kitchen',
        )->withTimestamps();
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
