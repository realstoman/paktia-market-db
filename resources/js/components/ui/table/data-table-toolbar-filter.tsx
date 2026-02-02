'use client';

import type { Column } from '@tanstack/react-table';
import * as React from 'react';

import { DataTableDateFilter } from '@/components/ui/table/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/ui/table/data-table-slider-filter';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

export function DataTableToolbarFilter<TData>({
  column
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  const filterValue = column.getFilterValue();

  console.log(`Filter for ${column.id}:`, {
    filterValue,
    meta: columnMeta,
    canFilter: column.getCanFilter(),
  });

  // Handle text input change
  const handleTextChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      console.log(`${column.id} filter changed to:`, event.target.value);
      column.setFilterValue(event.target.value);
    },
    [column]
  );

  // Handle number input change
  const handleNumberChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      console.log(`${column.id} number filter changed to:`, value);
      column.setFilterValue(value ? Number(value) : '');
    },
    [column]
  );

  if (!columnMeta?.variant) return null;

  switch (columnMeta.variant) {
    case 'text':
      return (
        <Input
          placeholder={columnMeta.placeholder ?? columnMeta.label}
          value={(filterValue as string) ?? ''}
          onChange={handleTextChange}
          className='h-8 w-40 lg:w-56'
        />
      );

    case 'number':
      return (
        <div className='relative'>
          <Input
            type='number'
            inputMode='numeric'
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(filterValue as string) ?? ''}
            onChange={handleNumberChange}
            className={cn('h-8 w-[120px]', columnMeta.unit && 'pr-8')}
          />
          {columnMeta.unit && (
            <span className='bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm'>
              {columnMeta.unit}
            </span>
          )}
        </div>
      );

    case 'range':
      return (
        <DataTableSliderFilter
          column={column}
          title={columnMeta.label ?? column.id}
        />
      );

    case 'date':
    case 'dateRange':
      return (
        <DataTableDateFilter
          column={column}
          title={columnMeta.label ?? column.id}
          multiple={columnMeta.variant === 'dateRange'}
        />
      );

    case 'select':
    case 'multiSelect':
      return (
        <DataTableFacetedFilter
          column={column}
          title={columnMeta.label ?? column.id}
          options={columnMeta.options ?? []}
          multiple={columnMeta.variant === 'multiSelect'}
        />
      );

    default:
      return null;
  }
}
