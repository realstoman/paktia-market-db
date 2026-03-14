<?php

namespace App\Enums;

enum ExpenseCategory: string
{
    case DAILY_EXPENSE = 'daily_expense';
    case SALARY = 'salary';
    case RENT = 'rent';
    case UTILITIES = 'utilities';
    case INTERNET = 'internet';
    case TRANSPORT = 'transport';
    case CLEANING = 'cleaning';
    case MAINTENANCE = 'maintenance';
    case MARKETING = 'marketing';
    case REPAIRS = 'repairs';
    case FUEL = 'fuel';
    case OFFICE_EXPENSE = 'office_expense';
    case RAW_MATERIAL = 'raw_material';
    case PACKAGING = 'packaging';
    case DIRECT_SUPPLIES = 'direct_supplies';
    case DISCOUNT_WASTAGE = 'discount_wastage';
    case MISCELLANEOUS = 'miscellaneous';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::DAILY_EXPENSE => 'Daily Expense',
            self::SALARY => 'Salary',
            self::RENT => 'Rent',
            self::UTILITIES => 'Utilities',
            self::INTERNET => 'Internet',
            self::TRANSPORT => 'Transport',
            self::CLEANING => 'Cleaning',
            self::MAINTENANCE => 'Maintenance',
            self::MARKETING => 'Marketing',
            self::REPAIRS => 'Repairs',
            self::FUEL => 'Fuel',
            self::OFFICE_EXPENSE => 'Office Expense',
            self::RAW_MATERIAL => 'Raw Material',
            self::PACKAGING => 'Packaging',
            self::DIRECT_SUPPLIES => 'Direct Supplies',
            self::DISCOUNT_WASTAGE => 'Discount / Wastage',
            self::MISCELLANEOUS => 'Miscellaneous',
            self::OTHER => 'Other',
        };
    }
}
