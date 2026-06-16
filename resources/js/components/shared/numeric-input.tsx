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

const sanitizeNumeric = (value: string): string =>
    normalizeLocalizedDigits(value).replace(/[^\d]/g, '');

const normalizeValue = (value: string | number): string => {
    const raw = normalizeLocalizedDigits(String(value ?? ''))
        .replaceAll(',', '')
        .trim();
    if (!raw) {
        return '';
    }

    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
        return String(Math.trunc(parsed));
    }

    return sanitizeNumeric(raw);
};

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
    const displayValue = formatWithCommas(normalizeValue(value));
    const min = parseBoundary(props.min);
    const max = parseBoundary(props.max);
    const step = parseStep(props.step);
    const normalizedCurrentValue = normalizeValue(value);
    const currentNumericValue = normalizedCurrentValue
        ? Number(normalizedCurrentValue)
        : null;

    const updateClampedValue = (nextValue: number) => {
        const clamped = clampValue(nextValue, min, max);
        onValueChange(String(Math.trunc(clamped)));
    };

    if (!showControls) {
        return (
            <Input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={(event) => {
                    const sanitized = sanitizeNumeric(event.target.value);

                    if (!sanitized) {
                        onValueChange('');
                        return;
                    }

                    updateClampedValue(Number(sanitized));
                }}
                onBlur={() => {
                    if (!normalizedCurrentValue) {
                        if (min !== null) {
                            onValueChange(String(Math.trunc(min)));
                        }

                        return;
                    }

                    updateClampedValue(Number(normalizedCurrentValue));
                }}
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
                inputMode="numeric"
                value={displayValue}
                onChange={(event) => {
                    const sanitized = sanitizeNumeric(event.target.value);

                    if (!sanitized) {
                        onValueChange('');
                        return;
                    }

                    updateClampedValue(Number(sanitized));
                }}
                onBlur={() => {
                    if (!normalizedCurrentValue) {
                        if (min !== null) {
                            onValueChange(String(Math.trunc(min)));
                        }

                        return;
                    }

                    updateClampedValue(Number(normalizedCurrentValue));
                }}
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
