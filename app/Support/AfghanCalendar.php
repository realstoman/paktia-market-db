<?php

namespace App\Support;

use Carbon\Carbon;
use DateTimeInterface;
use IntlDateFormatter;

class AfghanCalendar
{
    public const MONTH_NAMES = [
        1 => 'حمل',
        2 => 'ثور',
        3 => 'جوزا',
        4 => 'سرطان',
        5 => 'اسد',
        6 => 'سنبله',
        7 => 'میزان',
        8 => 'عقرب',
        9 => 'قوس',
        10 => 'جدی',
        11 => 'دلو',
        12 => 'حوت',
    ];

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
                'MMMM yyyy',
            );

            $formatted = $formatter->format($resolved);

            if (is_string($formatted) && $formatted !== '') {
                return $formatted;
            }
        }

        return $resolved->format('m/Y');
    }

    public static function currentMonth(): array
    {
        return self::monthForDate(Carbon::today());
    }

    public static function monthForDate(DateTimeInterface|string|null $date): array
    {
        $resolved = self::resolveDate($date) ?? Carbon::today();
        [$year, $month] = self::persianParts($resolved);

        return self::monthRange($year, $month);
    }

    public static function monthRange(int $year, int $month): array
    {
        $month = max(1, min(12, $month));
        $start = self::persianToGregorian($year, $month, 1);
        $nextMonth = $month === 12 ? 1 : $month + 1;
        $nextYear = $month === 12 ? $year + 1 : $year;
        $end = self::persianToGregorian($nextYear, $nextMonth, 1)->subDay();

        return [
            'year' => $year,
            'month' => $month,
            'month_name' => self::MONTH_NAMES[$month] ?? (string) $month,
            'label' => (self::MONTH_NAMES[$month] ?? (string) $month).' '.$year,
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
        ];
    }

    /**
     * @return array<int, array{year:int, month:int, month_name:string, label:string, start:string, end:string}>
     */
    public static function payrollMonthOptions(int $previous = 2, int $next = 6): array
    {
        $current = self::currentMonth();
        $options = [];

        for ($offset = -$previous; $offset <= $next; $offset++) {
            $absoluteMonth = ($current['month'] - 1) + $offset;
            $year = $current['year'] + intdiv($absoluteMonth, 12);
            $month = ($absoluteMonth % 12) + 1;

            if ($month <= 0) {
                $month += 12;
                $year -= 1;
            }

            $options[] = self::monthRange($year, $month);
        }

        return $options;
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

    /**
     * @return array{0:int, 1:int}
     */
    private static function persianParts(Carbon $date): array
    {
        if (class_exists(IntlDateFormatter::class)) {
            $formatter = new IntlDateFormatter(
                'en_US@calendar=persian',
                IntlDateFormatter::NONE,
                IntlDateFormatter::NONE,
                config('app.timezone'),
                IntlDateFormatter::TRADITIONAL,
                'yyyy-MM',
            );

            $formatted = $formatter->format($date);

            if (is_string($formatted) && preg_match('/^(\d{4})-(\d{2})$/', $formatted, $matches)) {
                return [(int) $matches[1], (int) $matches[2]];
            }
        }

        return [(int) $date->format('Y'), (int) $date->format('m')];
    }

    private static function persianToGregorian(int $year, int $month, int $day): Carbon
    {
        if (class_exists(IntlDateFormatter::class)) {
            $formatter = new IntlDateFormatter(
                'en_US@calendar=persian',
                IntlDateFormatter::NONE,
                IntlDateFormatter::NONE,
                config('app.timezone'),
                IntlDateFormatter::TRADITIONAL,
                'yyyy-MM-dd',
            );
            $timestamp = $formatter->parse(sprintf('%04d-%02d-%02d', $year, $month, $day));

            if ($timestamp !== false) {
                return Carbon::createFromTimestamp($timestamp, config('app.timezone'))->startOfDay();
            }
        }

        return Carbon::create($year, $month, $day, 0, 0, 0, config('app.timezone'));
    }
}
