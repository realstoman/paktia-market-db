<?php

namespace App\Enums;

enum FulfillmentType: string
{
    case DINE_IN = 'dine_in';
    case TAKEAWAY = 'takeaway';
    case DELIVERY = 'delivery';
}
