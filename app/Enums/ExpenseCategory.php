<?php

namespace App\Enums;

enum ExpenseCategory: string
{
    case SALARY = 'salary';
    case UTILITIES = 'utilities';
    case RENT = 'rent';
    case MAINTENANCE = 'maintenance';
    case SUPPLIES = 'supplies';
    case OTHER = 'other';
}
