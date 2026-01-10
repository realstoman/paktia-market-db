<?php

namespace App\Enums;

enum Currency: string
{
    case AFN = 'AFN';
    case USD = 'USD';
    case AED = 'AED';

    public function symbol(): string
    {
        return match ($this) {
            self::AFN => '؋',
            self::USD => '$',
            self::AED => 'د.إ',
        };
    }
}
