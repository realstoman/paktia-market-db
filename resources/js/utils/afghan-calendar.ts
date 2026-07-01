const PERSIAN_LOCALE = 'en-US-u-ca-persian-nu-latn';
const AFGHAN_MONTH_NAMES = [
    'حمل',
    'ثور',
    'جوزا',
    'سرطان',
    'اسد',
    'سنبله',
    'میزان',
    'عقرب',
    'قوس',
    'جدی',
    'دلو',
    'حوت',
];
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianDigits(value: string | number) {
    return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function resolveDate(value?: string | number | Date | null) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAfghanMonthLabel(value?: string | number | Date | null) {
    const parts = getAfghanDateParts(value);

    if (!parts) {
        return '-';
    }

    return parts.monthName && parts.year
        ? `${parts.monthName} ${toPersianDigits(parts.year)}`
        : '-';
}

function getAfghanDateParts(value?: string | number | Date | null) {
    const date = resolveDate(value);

    if (!date) {
        return null;
    }

    const parts = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).formatToParts(date);
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const year = parts.find((part) => part.type === 'year')?.value ?? '';

    return {
        day,
        month,
        monthName: AFGHAN_MONTH_NAMES[Number(month) - 1] ?? '',
        year,
    };
}

export function formatAfghanDate(value?: string | number | Date | null) {
    const parts = getAfghanDateParts(value);

    if (!parts) {
        return '-';
    }

    return parts.day && parts.monthName && parts.year
        ? `${toPersianDigits(Number(parts.day))} ${parts.monthName} ${toPersianDigits(parts.year)}`
        : '-';
}

export function formatAfghanPeriodLabel(
    start?: string | number | Date | null,
    end?: string | number | Date | null,
) {
    const startParts = getAfghanDateParts(start);
    const endParts = getAfghanDateParts(end || start);

    if (!startParts) {
        return '-';
    }

    const startLabel = formatAfghanMonthLabel(start);

    if (
        !endParts ||
        (startParts.month === endParts.month && startParts.year === endParts.year)
    ) {
        return startLabel;
    }

    return `${startLabel} الی ${formatAfghanMonthLabel(end)}`;
}
