'use client';

import type { Table } from '@tanstack/react-table';
import * as React from 'react';

import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CrossIcon } from 'lucide-react';
import { DataTableToolbarFilter } from './data-table-toolbar-filter';

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  console.log('DataTableToolbar - Column filters:', table.getState().columnFilters);
  console.log('DataTableToolbar - Filtered rows:', table.getFilteredRowModel().rows.length);

  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = React.useMemo(
    () => {
      const filterableColumns = table.getAllColumns().filter((column) => {
        const canFilter = column.getCanFilter();
        console.log(`Column ${column.id}: canFilter = ${canFilter}`);
        return canFilter;
      });
      console.log('Filterable columns:', filterableColumns.map(c => c.id));
      return filterableColumns;
    },
    [table]
  );

  const onReset = React.useCallback(() => {
    console.log('Resetting all filters');
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      role='toolbar'
      aria-orientation='horizontal'
      className={cn(
        'flex w-full items-start justify-between gap-2 p-1',
        className
      )}
      {...props}
    >
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered && (
          <Button
            aria-label='Reset filters'
            variant='outline'
            size='sm'
            className='border-dashed'
            onClick={onReset}
          >
            <CrossIcon className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
