<?php

namespace App\Enums;

enum OrderItemStatus: string
{
    case PENDING = 'pending';
    case PREPARING = 'preparing';
    case READY = 'ready';
    case SERVED = 'served';
    case CANCELLED = 'cancelled';
}
