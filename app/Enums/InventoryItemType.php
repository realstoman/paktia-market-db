<?php

namespace App\Enums;

enum InventoryItemType: string
{
    case CONSUMABLE = 'consumable'; // rice, oil
    case FIXED = 'fixed'; // desk, computer
}
