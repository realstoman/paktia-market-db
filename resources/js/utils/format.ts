// Format number and add comma to it
export const formatNumber = (value: number | string) => {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(Number(value));
};
