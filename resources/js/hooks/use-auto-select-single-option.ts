import * as React from 'react';

interface SelectOptionLike {
    value: string;
}

export function useAutoSelectSingleOption(
    options: SelectOptionLike[],
    value: string,
    onChange: (value: string) => void,
    emptyValues: string[] = [''],
) {
    React.useEffect(() => {
        if (options.length !== 1) {
            return;
        }

        if (!emptyValues.includes(value)) {
            return;
        }

        onChange(options[0].value);
    }, [emptyValues, onChange, options, value]);
}
