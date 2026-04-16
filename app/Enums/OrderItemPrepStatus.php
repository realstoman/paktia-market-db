<?php

namespace App\Enums;

enum OrderItemPrepStatus: string
{
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case READY = 'ready';
    case DELIVERED = 'delivered';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
