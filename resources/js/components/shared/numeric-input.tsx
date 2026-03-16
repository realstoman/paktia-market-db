import { Input } from '@/components/ui/input';
import * as React from 'react';

interface NumericInputProps
    extends Omit<
        React.ComponentProps<typeof Input>,
        'type' | 'value' | 'onChange' | 'inputMode'
    > {
    value: string | number;
    onValueChange: (value: string) => void;
}

const sanitizeNumeric = (value: string): string =>
    value.replace(/[^\d]/g, '');

const formatWithCommas = (value: string): string => {
    if (!value) {
        return '';
    }

    const normalized = String(Number(value));
    if (normalized === '0' && value !== '0') {
        return '';
    }

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(Number(normalized));
};

export function NumericInput({
    value,
    onValueChange,
    ...props
}: NumericInputProps) {
    const normalizedValue =
        typeof value === 'number' ? String(Math.trunc(value)) : value;
    const displayValue = formatWithCommas(sanitizeNumeric(normalizedValue));

    return (
        <Input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={(event) => {
                onValueChange(sanitizeNumeric(event.target.value));
            }}
            {...props}
        />
    );
}
