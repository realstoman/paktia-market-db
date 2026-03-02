/**
 * BABA PLATFORM REUSABLE FORMATS
 * Author: @realstoman
 */

/**
 * Format plain numbers (no decimals)
 * Example: 234567 -> 234,567
 */
export const formatNumber = (value: number | string) => {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(Number(value));
};

/**
 * Format price / cost with 2 decimal places
 * Example: 234567 -> 234,567.00
 */
export const formatPrice = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));
};

/**
 * Format price with currency symbol
 * Example: 234567 -> $234,567.00
 */
export const formatCurrency = (
    value: number | string,
    currency: string = 'USD',
): string => {
    if (value === null || value === undefined || value === '') return '';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));
};

/**
 * Format AFN currency (no decimals)
 * Example: 234567 -> ؋234,567
 */
export const formatAfn = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';

    return ` ؋ ${new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(Math.round(Number(value)))}`;
};
