import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

interface SearchableDropdownOption {
    value: string;
    label: string;
}

interface SearchableDropdownProps {
    value: string;
    options: SearchableDropdownOption[];
    onValueChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    isLoading?: boolean;
    loadingText?: string;
}

export function SearchableDropdown({
    value,
    options,
    onValueChange,
    placeholder,
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    className,
    searchValue,
    onSearchChange,
    isLoading = false,
    loadingText = 'Loading...',
}: SearchableDropdownProps) {
    const { isRtl } = useLocalization();
    const [open, setOpen] = useState(false);
    const [internalSearchValue, setInternalSearchValue] = useState('');

    const resolvedSearchValue = searchValue ?? internalSearchValue;

    const handleSearchChange = (value: string) => {
        if (onSearchChange) {
            onSearchChange(value);
            return;
        }

        setInternalSearchValue(value);
    };

    const selectedLabel = useMemo(
        () => options.find((option) => option.value === value)?.label,
        [options, value],
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    dir={isRtl ? 'rtl' : 'ltr'}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-10 w-full justify-between border border-input px-3 font-normal',
                        isRtl && 'text-right',
                        className,
                    )}
                >
                    <span className={cn('truncate', isRtl && 'text-right')}>
                        {selectedLabel ?? placeholder}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                dir={isRtl ? 'rtl' : 'ltr'}
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
            >
                <Command dir={isRtl ? 'rtl' : 'ltr'}>
                    <CommandInput
                        className={cn(isRtl && 'text-right')}
                        placeholder={searchPlaceholder}
                        value={resolvedSearchValue}
                        onValueChange={handleSearchChange}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading ? loadingText : emptyText}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.value}`}
                                    dir="ltr"
                                    className={cn(
                                        'flex w-full items-center',
                                        isRtl && 'text-right',
                                    )}
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'h-4 w-4 shrink-0',
                                            !isRtl && 'mr-2',
                                            value === option.value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    <span
                                        dir={isRtl ? 'rtl' : 'ltr'}
                                        className={cn(
                                            'flex-1 truncate',
                                            isRtl && 'text-right',
                                        )}
                                    >
                                        {option.label}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
