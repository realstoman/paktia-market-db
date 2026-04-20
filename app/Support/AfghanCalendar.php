<?php

namespace App\Support;

use Carbon\Carbon;
use DateTimeInterface;
use IntlDateFormatter;

class AfghanCalendar
{
    public static function formatMonthLabel(DateTimeInterface|string|null $date): string
    {
        $resolved = self::resolveDate($date);

        if (! $resolved) {
            return '-';
        }

        if (class_exists(IntlDateFormatter::class)) {
            $formatter = new IntlDateFormatter(
                'en_US@calendar=persian',
                IntlDateFormatter::NONE,
                IntlDateFormatter::NONE,
                config('app.timezone'),
                IntlDateFormatter::TRADITIONAL,
                'MM/yyyy',
            );

            $formatted = $formatter->format($resolved);

            if (is_string($formatted) && $formatted !== '') {
                return $formatted;
            }
        }

        return $resolved->format('m/Y');
    }

    public static function formatDate(DateTimeInterface|string|null $date): string
    {
        $resolved = self::resolveDate($date);

        if (! $resolved) {
            return '-';
        }

        if (class_exists(IntlDateFormatter::class)) {
            $formatter = new IntlDateFormatter(
                'en_US@calendar=persian',
                IntlDateFormatter::NONE,
                IntlDateFormatter::NONE,
                config('app.timezone'),
                IntlDateFormatter::TRADITIONAL,
                'yyyy/MM/dd',
            );

            $formatted = $formatter->format($resolved);

            if (is_string($formatted) && $formatted !== '') {
                return $formatted;
            }
        }

        return $resolved->format('Y/m/d');
    }

    private static function resolveDate(DateTimeInterface|string|null $date): ?Carbon
    {
        if (! $date) {
            return null;
        }

        return $date instanceof DateTimeInterface
            ? Carbon::instance($date)
            : Carbon::parse($date);
    }
}
