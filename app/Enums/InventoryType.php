<?php

namespace App\Enums;

enum InventoryType: string
{
    case RAW_MATERIAL = 'raw_material';
    case PACKAGING = 'packaging';
    case EQUIPMENT = 'equipment';
    case CONSUMABLE = 'consumable';
}
