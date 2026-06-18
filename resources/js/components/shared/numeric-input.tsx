import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeLocalizedDigits } from '@/utils/input-normalization';
import { Minus, Plus } from 'lucide-react';
import * as React from 'react';

interface NumericInputProps
    extends Omit<
        React.ComponentProps<typeof Input>,
        'type' | 'value' | 'onChange' | 'inputMode'
    > {
    value: string | number;
    onValueChange: (value: string) => void;
    showControls?: boolean;
}

const decimalPlaces = (step: NumericInputProps['step']): number | null => {
    if (step === 'any') {
        return null;
    }

    const raw = String(step ?? '1');
    if (raw.includes('e-')) {
        return Number(raw.split('e-')[1]);
    }

    return raw.includes('.') ? raw.split('.')[1].length : 0;
};

const sanitizeNumeric = (
    value: string,
    allowDecimal: boolean,
    allowNegative: boolean,
): string => {
    const normalized = normalizeLocalizedDigits(value)
        .replaceAll('٫', '.')
        .replaceAll('٬', '')
        .replaceAll(',', '')
        .trim();
    const negative = allowNegative && normalized.startsWith('-');
    const unsigned = normalized.replace(/[^\d.]/g, '');
    const [integerPart = '', ...fractionParts] = unsigned.split('.');
    const integer = integerPart.replace(/^0+(?=\d)/, '');
    const hasDecimalPoint = allowDecimal && unsigned.includes('.');
    const fraction = allowDecimal ? fractionParts.join('') : '';
    const number = `${integer || (hasDecimalPoint ? '0' : '')}${
        hasDecimalPoint ? `.${fraction}` : ''
    }`;

    if (!number) {
        return negative ? '-' : '';
    }

    return `${negative ? '-' : ''}${number}`;
};

const normalizeValue = (
    value: string | number,
    allowDecimal: boolean,
    allowNegative: boolean,
): string => sanitizeNumeric(String(value ?? ''), allowDecimal, allowNegative);

const formatWithCommas = (value: string): string => {
    if (!value) {
        return '';
    }

    if (value === '-') {
        return '-';
    }

    const negative = value.startsWith('-');
    const unsigned = negative ? value.slice(1) : value;
    const [integer = '', fraction] = unsigned.split('.');
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return `${negative ? '-' : ''}${grouped}${
        fraction !== undefined ? `.${fraction}` : ''
    }`;
};

const parseBoundary = (
    value:
        | React.ComponentProps<typeof Input>['min']
        | React.ComponentProps<typeof Input>['max'],
): number | null => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
};

const parseStep = (
    value: React.ComponentProps<typeof Input>['step'],
): number => {
    if (value === undefined || value === null || value === '') {
        return 1;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const clampValue = (
    value: number,
    min: number | null,
    max: number | null,
): number => {
    if (min !== null && value < min) {
        return min;
    }

    if (max !== null && value > max) {
        return max;
    }

    return value;
};

export function NumericInput({
    value,
    onValueChange,
    showControls = true,
    ...props
}: NumericInputProps) {
    const min = parseBoundary(props.min);
    const max = parseBoundary(props.max);
    const step = parseStep(props.step);
    const scale = decimalPlaces(props.step);
    const allowDecimal = scale === null || scale > 0;
    const allowNegative = min === null || min < 0;
    const normalizedCurrentValue = normalizeValue(
        value,
        allowDecimal,
        allowNegative,
    );
    const displayValue = formatWithCommas(normalizedCurrentValue);
    const parsedCurrentValue = Number(normalizedCurrentValue);
    const currentNumericValue =
        normalizedCurrentValue && Number.isFinite(parsedCurrentValue)
            ? parsedCurrentValue
            : null;

    const serialize = (nextValue: number): string => {
        if (!allowDecimal) {
            return String(Math.trunc(nextValue));
        }

        if (scale === null) {
            return String(nextValue);
        }

        return nextValue.toFixed(scale).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
    };

    const updateClampedValue = (nextValue: number) => {
        const clamped = clampValue(nextValue, min, max);
        onValueChange(serialize(clamped));
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeNumeric(
            event.target.value,
            allowDecimal,
            allowNegative,
        );

        onValueChange(sanitized);
    };

    const handleBlur = () => {
        if (!normalizedCurrentValue || normalizedCurrentValue === '-') {
            if (min !== null) {
                onValueChange(serialize(min));
            }

            return;
        }

        updateClampedValue(Number(normalizedCurrentValue));
    };

    if (!showControls) {
        return (
            <Input
                type="text"
                inputMode={allowDecimal ? 'decimal' : 'numeric'}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                {...props}
            />
        );
    }

    return (
        <div className="flex items-center overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-colors transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-none border-r"
                disabled={
                    props.disabled ||
                    (currentNumericValue !== null &&
                        min !== null &&
                        currentNumericValue <= min)
                }
                onClick={() =>
                    updateClampedValue((currentNumericValue ?? min ?? 0) - step)
                }
            >
                <Minus className="h-4 w-4" />
            </Button>
            <Input
                type="text"
                inputMode={allowDecimal ? 'decimal' : 'numeric'}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className="h-9 rounded-none border-0 text-center shadow-none focus-visible:ring-0"
                {...props}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-none border-l"
                disabled={
                    props.disabled ||
                    (currentNumericValue !== null &&
                        max !== null &&
                        currentNumericValue >= max)
                }
                onClick={() =>
                    updateClampedValue((currentNumericValue ?? min ?? 0) + step)
                }
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
