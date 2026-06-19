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
    disabled?: boolean;
}

export function SearchableDropdown({
    value,
    options,
    onValueChange,
    placeholder,
    searchPlaceholder,
    emptyText,
    className,
    searchValue,
    onSearchChange,
    isLoading = false,
    loadingText,
    disabled = false,
}: SearchableDropdownProps) {
    const { isRtl, t } = useLocalization();
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
    const checkIcon = (selected: boolean) => (
        <Check
            className={cn(
                'size-4 shrink-0 text-brand-primary',
                selected ? 'opacity-100' : 'opacity-0',
            )}
        />
    );

    return (
        <Popover
            open={open}
            onOpenChange={(nextOpen) => {
                if (!disabled) {
                    setOpen(nextOpen);
                }

                if (!nextOpen && searchValue === undefined) {
                    setInternalSearchValue('');
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    dir={isRtl ? 'rtl' : 'ltr'}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'h-10 w-full justify-between border border-input bg-white px-3 font-normal shadow-xs dark:bg-neutral-900',
                        isRtl ? 'text-right' : 'text-left',
                        className,
                    )}
                >
                    <span
                        className={cn(
                            'min-w-0 flex-1 truncate',
                            isRtl ? 'text-right' : 'text-left',
                        )}
                    >
                        {selectedLabel ?? placeholder}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                dir={isRtl ? 'rtl' : 'ltr'}
                align={isRtl ? 'end' : 'start'}
                sideOffset={6}
                className="w-[--radix-popover-trigger-width] overflow-hidden rounded-xl border-border/80 p-0 shadow-xl"
            >
                <Command dir={isRtl ? 'rtl' : 'ltr'}>
                    <CommandInput
                        className={cn(isRtl && 'text-right')}
                        placeholder={
                            searchPlaceholder || t('common.search', 'Search…')
                        }
                        value={resolvedSearchValue}
                        onValueChange={handleSearchChange}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading
                                ? (loadingText ??
                                  t('common.loading', 'Loading…'))
                                : (emptyText ??
                                  t(
                                      'common.noResultsFound',
                                      'No results found.',
                                  ))}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.value}`}
                                    className={cn(
                                        'flex w-full !flex-row items-center rounded-lg px-3 py-2.5',
                                        isRtl ? 'text-right' : 'text-left',
                                    )}
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    {!isRtl &&
                                        checkIcon(value === option.value)}
                                    <span
                                        dir={isRtl ? 'rtl' : 'ltr'}
                                        className={cn(
                                            'flex-1 truncate',
                                            isRtl && 'text-right',
                                        )}
                                    >
                                        {option.label}
                                    </span>
                                    {isRtl && checkIcon(value === option.value)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
