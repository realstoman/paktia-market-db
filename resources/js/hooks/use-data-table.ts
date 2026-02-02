'use client';

import {
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type TableOptions,
    type TableState,
    type VisibilityState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

// const DEBOUNCE_MS = 300;

interface UseDataTableProps<TData>
    extends Omit<TableOptions<TData>, 'state' | 'getCoreRowModel'> {
    initialState?: Partial<TableState>;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
    const { data, columns, initialState, ...tableProps } = props;

    console.log('useDataTable - Data:', data?.length);
    console.log('useDataTable - Columns:', columns?.length);

    // Local state for all table features
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        initialState?.rowSelection ?? {},
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>(initialState?.columnFilters ?? []);
    const [sorting, setSorting] = React.useState<SortingState>(
        initialState?.sorting ?? [],
    );
    const [pagination, setPagination] = React.useState<PaginationState>(
        initialState?.pagination ?? {
            pageIndex: 0,
            pageSize: 10,
        },
    );

    // Debug logs
    React.useEffect(() => {
        console.log('Column filters updated:', columnFilters);
    }, [columnFilters]);

    React.useEffect(() => {
        console.log('Sorting updated:', sorting);
    }, [sorting]);

    // Create the table
    const table = useReactTable({
        ...tableProps,
        data,
        columns,
        state: {
            columnFilters,
            sorting,
            columnVisibility,
            rowSelection,
            pagination,
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: false, // Client-side pagination
        manualSorting: false, // Client-side sorting
        manualFiltering: false, // Client-side filtering
    });

    console.log('Table created:', {
        rows: table.getRowModel().rows.length,
        filteredRows: table.getFilteredRowModel().rows.length,
        columnFilters: table.getState().columnFilters,
    });

    return { table };
}
