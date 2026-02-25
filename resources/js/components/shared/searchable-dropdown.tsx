import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
}

export function SearchableDropdown({
    value,
    options,
    onValueChange,
    placeholder,
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    className,
}: SearchableDropdownProps) {
    const [open, setOpen] = useState(false);

    const selectedLabel = useMemo(
        () => options.find((option) => option.value === value)?.label,
        [options, value],
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-10 w-full justify-between border border-input px-3 font-normal',
                        className,
                    )}
                >
                    <span className="truncate">{selectedLabel ?? placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.value}`}
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === option.value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
