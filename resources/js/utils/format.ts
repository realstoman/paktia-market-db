/**
 * BABA PLATFORM REUSABLE FORMATS
 * Author: @realstoman
 */

const localeMap: Record<string, string> = {
    en: 'en-US',
    fa: 'fa-AF',
    ps: 'ps-AF',
};

let activeLocaleCode: string | null = null;

export const setFormattingLocale = (locale: string) => {
    activeLocaleCode = locale;
};

const resolveLocale = () => {
    if (activeLocaleCode) {
        return localeMap[activeLocaleCode] ?? activeLocaleCode;
    }

    if (typeof document === 'undefined') {
        return 'en-US';
    }

    const rawLocale = document.documentElement.lang || 'en';

    return localeMap[rawLocale] ?? rawLocale;
};

/**
 * Format plain numbers (no decimals)
 * Example: 234567 -> 234,567
 */
export const formatNumber = (value: number | string) => {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat(resolveLocale(), {
        maximumFractionDigits: 0,
    }).format(Number(value));
};

/**
 * Format price / cost with no decimal places
 * Example: 234567 -> 234,567
 */
export const formatPrice = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';

    return new Intl.NumberFormat(resolveLocale(), {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value));
};

/**
 * Format price with currency symbol and no decimal places
 * Example: 234567 -> $234,567
 */
export const formatCurrency = (
    value: number | string,
    currency: string = 'USD',
): string => {
    if (value === null || value === undefined || value === '') return '';

    return new Intl.NumberFormat(resolveLocale(), {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value));
};

/**
 * Format AFN currency (no decimals)
 * Example: 234567 -> ؋234,567
 */
export const formatAfn = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';

    return ` ؋ ${new Intl.NumberFormat(resolveLocale(), {
        maximumFractionDigits: 0,
    }).format(Math.round(Number(value)))}`;
};
