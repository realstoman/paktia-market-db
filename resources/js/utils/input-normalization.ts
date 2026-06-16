const EASTERN_ARABIC_DIGIT_ZERO = '۰'.charCodeAt(0);
const ARABIC_INDIC_DIGIT_ZERO = '٠'.charCodeAt(0);

export function normalizeLocalizedDigits(value: string): string {
    return value.replace(/[۰-۹٠-٩]/g, (digit) => {
        const code = digit.charCodeAt(0);

        if (code >= EASTERN_ARABIC_DIGIT_ZERO) {
            return String(code - EASTERN_ARABIC_DIGIT_ZERO);
        }

        return String(code - ARABIC_INDIC_DIGIT_ZERO);
    });
}

export function normalizeNumericInputValue(value: string): string {
    return normalizeLocalizedDigits(value)
        .replaceAll('٫', '.')
        .replaceAll('٬', ',');
}
