<?php

namespace App\Enums;

enum ProductType: string
{
    case FOOD = 'food';
    case GIFT = 'gift';
    case INVENTORY = 'inventory';
}
