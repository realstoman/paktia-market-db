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

function resolveDate(value?: string | number | Date | null) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAfghanMonthLabel(value?: string | number | Date | null) {
    const date = resolveDate(value);

    if (!date) {
        return '-';
    }

    const parts = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
        month: '2-digit',
        year: 'numeric',
    }).formatToParts(date);

    const month =
        parts.find((part) => part.type === 'month')?.value ?? '';
    const year =
        parts.find((part) => part.type === 'year')?.value ?? '';
    const monthName = AFGHAN_MONTH_NAMES[Number(month) - 1];

    return monthName && year ? `${monthName} ${year}` : '-';
}

export function formatAfghanDate(value?: string | number | Date | null) {
    const date = resolveDate(value);

    if (!date) {
        return '-';
    }

    const parts = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).formatToParts(date);

    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const month =
        parts.find((part) => part.type === 'month')?.value ?? '';
    const year =
        parts.find((part) => part.type === 'year')?.value ?? '';

    return day && month && year ? `${day}/${month}/${year}` : '-';
}
