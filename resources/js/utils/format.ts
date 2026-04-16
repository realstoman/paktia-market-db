/**
 * BABA PLATFORM REUSABLE FORMATS
 * Author: @realstoman
 */

const numberLocale = 'en-US';

export const setFormattingLocale = (locale: string) => {
    void locale;
};

/**
 * Format plain numbers (no decimals)
 * Example: 234567 -> 234,567
 */
export const formatNumber = (value: number | string) => {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat(numberLocale, {
        maximumFractionDigits: 0,
        useGrouping: true,
    }).format(Number(value));
};

/**
 * Format price / cost with no decimal places
 * Example: 234567 -> 234,567
 */
export const formatPrice = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';

    return new Intl.NumberFormat(numberLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
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

    return new Intl.NumberFormat(numberLocale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
    }).format(Number(value));
};

/**
 * Format AFN currency (no decimals)
 * Example: 234567 -> ؋234,567
 */
export const formatAfn = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';

    return ` ؋ ${new Intl.NumberFormat(numberLocale, {
        maximumFractionDigits: 0,
        useGrouping: true,
    }).format(Math.round(Number(value)))}`;
};
