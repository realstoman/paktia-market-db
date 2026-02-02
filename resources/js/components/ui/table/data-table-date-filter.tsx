'use client';

import type { Column } from '@tanstack/react-table';
import { CalendarIcon, XCircle } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';

interface DataTableDateFilterProps<TData> {
  column: Column<TData>;
  title?: string;
  multiple?: boolean;
}

export function DataTableDateFilter<TData>({
  column,
  title,
  multiple
}: DataTableDateFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();

  console.log(`Date filter for ${column.id}:`, columnFilterValue);

  const selectedDates = React.useMemo(() => {
    if (!columnFilterValue) {
      return multiple ? { from: undefined, to: undefined } : undefined;
    }

    if (multiple) {
      if (Array.isArray(columnFilterValue) && columnFilterValue.length === 2) {
        const from = columnFilterValue[0] ? new Date(columnFilterValue[0]) : undefined;
        const to = columnFilterValue[1] ? new Date(columnFilterValue[1]) : undefined;
        return { from, to };
      }
      return { from: undefined, to: undefined };
    }

    // Single date
    const date = columnFilterValue ? new Date(columnFilterValue as number) : undefined;
    return date;
  }, [columnFilterValue, multiple]);

  const onSelect = React.useCallback(
    (date: Date | DateRange | undefined) => {
      console.log('Date selected:', date);

      if (!date) {
        column.setFilterValue(undefined);
        return;
      }

      if (multiple && !('getTime' in date)) {
        const from = date.from?.getTime();
        const to = date.to?.getTime();
        column.setFilterValue(from || to ? [from, to] : undefined);
      } else if (!multiple && 'getTime' in date) {
        column.setFilterValue(date.getTime());
      }
    },
    [column, multiple]
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      console.log('Resetting date filter');
      column.setFilterValue(undefined);
    },
    [column]
  );

  const hasValue = React.useMemo(() => {
    if (multiple) {
      return selectedDates?.from || selectedDates?.to;
    }
    return !!selectedDates;
  }, [selectedDates, multiple]);

  const formatDateRange = React.useCallback((range: { from?: Date; to?: Date }) => {
    if (!range.from && !range.to) return '';
    if (range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    }
    return formatDate(range.from ?? range.to);
  }, []);

  const label = React.useMemo(() => {
    if (multiple) {
      const dateText = hasValue
        ? formatDateRange(selectedDates as { from?: Date; to?: Date })
        : 'Select date range';

      return (
        <span className='flex items-center gap-2'>
          <span>{title}</span>
          {hasValue && (
            <>
              <Separator
                orientation='vertical'
                className='mx-0.5 h-4'
              />
              <span>{dateText}</span>
            </>
          )}
        </span>
      );
    }

    const dateText = hasValue
      ? formatDate(selectedDates as Date)
      : 'Select date';

    return (
      <span className='flex items-center gap-2'>
        <span>{title}</span>
        {hasValue && (
          <>
            <Separator
              orientation='vertical'
              className='mx-0.5 h-4'
            />
            <span>{dateText}</span>
          </>
        )}
      </span>
    );
  }, [selectedDates, multiple, hasValue, formatDateRange, title]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='border-dashed'>
          {hasValue ? (
            <div
              role='button'
              tabIndex={0}
              onClick={onReset}
              className='rounded-sm opacity-70 transition-opacity hover:opacity-100'
            >
              <XCircle className="h-4 w-4" />
            </div>
          ) : (
            <CalendarIcon className="h-4 w-4" />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        {multiple ? (
          <Calendar
            initialFocus
            mode='range'
            selected={selectedDates as DateRange}
            onSelect={onSelect}
          />
        ) : (
          <Calendar
            initialFocus
            mode='single'
            selected={selectedDates as Date}
            onSelect={onSelect}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
