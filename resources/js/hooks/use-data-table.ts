'use client';

import { router, usePage } from '@inertiajs/react';
import {
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type TableOptions,
    type TableState,
    type Updater,
    type VisibilityState,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import type { ExtendedColumnSort } from '@/types/data-table';
import { useDebouncedCallback } from './use-debounced-callback';

const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'perPage';
const SORT_KEY = 'sort';
const DEBOUNCE_MS = 300;

interface UseDataTableProps<TData>
    extends Omit<
            TableOptions<TData>,
            | 'state'
            | 'pageCount'
            | 'getCoreRowModel'
            | 'manualFiltering'
            | 'manualPagination'
            | 'manualSorting'
        >,
        Required<Pick<TableOptions<TData>, 'pageCount'>> {
    data: TData[]; // Add this - it's missing!
    initialState?: Omit<Partial<TableState>, 'sorting'> & {
        sorting?: ExtendedColumnSort<TData>[];
    };
    debounceMs?: number;
    shallow?: boolean;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
    const {
        data, // Add this - critical!
        columns,
        pageCount = -1,
        initialState,
        debounceMs = DEBOUNCE_MS,
        shallow = true,
        ...tableProps
    } = props;

    console.log('useDataTable - Data received:', data?.length, 'items');
    console.log('useDataTable - Columns:', columns?.length);

    const { url } = usePage();

    // Get current query params from URL
    const getQueryParams = React.useCallback(() => {
        if (typeof window === 'undefined') {
            return {
                page: 1,
                perPage: initialState?.pagination?.pageSize ?? 10,
                sort: [],
            };
        }

        const searchParams = new URLSearchParams(window.location.search);
        return {
            page: searchParams.get(PAGE_KEY)
                ? parseInt(searchParams.get(PAGE_KEY)!)
                : 1,
            perPage: searchParams.get(PER_PAGE_KEY)
                ? parseInt(searchParams.get(PER_PAGE_KEY)!)
                : (initialState?.pagination?.pageSize ?? 10),
            sort: searchParams.get(SORT_KEY)
                ? JSON.parse(searchParams.get(SORT_KEY)!)
                : [],
            ...Object.fromEntries(searchParams.entries()),
        };
    }, [initialState]);

    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        initialState?.rowSelection ?? {},
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

    const [queryParams, setQueryParams] = React.useState(getQueryParams());

    // Update query params when URL changes
    React.useEffect(() => {
        setQueryParams(getQueryParams());
    }, [url, getQueryParams]);

    const pagination: PaginationState = React.useMemo(() => {
        return {
            pageIndex: queryParams.page - 1, // zero-based index -> one-based index
            pageSize: queryParams.perPage,
        };
    }, [queryParams.page, queryParams.perPage]);

    const updateUrl = React.useCallback(
        (params: Record<string, any>) => {
            const currentParams = getQueryParams();
            const newParams = { ...currentParams, ...params };

            // Remove undefined/null values
            Object.keys(newParams).forEach((key) => {
                if (
                    newParams[key] === undefined ||
                    newParams[key] === null ||
                    newParams[key] === ''
                ) {
                    delete newParams[key];
                }
            });

            console.log('Updating URL with params:', newParams);

            router.get(url.split('?')[0], newParams, {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            });
        },
        [url, getQueryParams],
    );

    const onPaginationChange = React.useCallback(
        (updaterOrValue: Updater<PaginationState>) => {
            let newPagination: PaginationState;

            if (typeof updaterOrValue === 'function') {
                newPagination = updaterOrValue(pagination);
            } else {
                newPagination = updaterOrValue;
            }

            updateUrl({
                [PAGE_KEY]: newPagination.pageIndex + 1,
                [PER_PAGE_KEY]: newPagination.pageSize,
            });
        },
        [pagination, updateUrl],
    );

    const sorting: ExtendedColumnSort<TData>[] = React.useMemo(() => {
        return queryParams.sort || initialState?.sorting || [];
    }, [queryParams.sort, initialState?.sorting]);

    const onSortingChange = React.useCallback(
        (updaterOrValue: Updater<SortingState>) => {
            let newSorting: ExtendedColumnSort<TData>[];

            if (typeof updaterOrValue === 'function') {
                newSorting = updaterOrValue(
                    sorting,
                ) as ExtendedColumnSort<TData>[];
            } else {
                newSorting = updaterOrValue as ExtendedColumnSort<TData>[];
            }

            updateUrl({
                [SORT_KEY]: JSON.stringify(newSorting),
            });
        },
        [sorting, updateUrl],
    );

    const filterableColumns = React.useMemo(() => {
        const filterable = columns.filter(
            (column) => column.enableColumnFilter,
        );
        console.log(
            'Filterable columns:',
            filterable.map((c) => ({
                id: c.id,
                accessorKey: (c as any).accessorKey,
                meta: c.meta,
            })),
        );
        return filterable;
    }, [columns]);

    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>(initialState?.columnFilters || []);

    // Initialize column filters from URL
    React.useEffect(() => {
        console.log('Initializing column filters from URL');
        const initialFilters: ColumnFiltersState = [];

        filterableColumns.forEach((column) => {
            const value = queryParams[column.id ?? ''];
            if (value !== undefined && value !== null) {
                const processedValue = Array.isArray(value)
                    ? value
                    : typeof value === 'string'
                      ? value.split(',').filter(Boolean)
                      : [value];

                console.log(
                    `Setting initial filter for ${column.id}:`,
                    processedValue,
                );

                initialFilters.push({
                    id: column.id ?? '',
                    value: processedValue,
                });
            }
        });

        console.log('Initial column filters:', initialFilters);
        setColumnFilters(initialFilters);
    }, [filterableColumns, queryParams]);

    const debouncedUpdateFilters = useDebouncedCallback(
        (filters: ColumnFiltersState) => {
            console.log('Debounced filter update:', filters);

            const filterUpdates: Record<string, any> = {};

            filters.forEach((filter) => {
                const column = filterableColumns.find(
                    (c) => c.id === filter.id,
                );
                if (column) {
                    if (
                        Array.isArray(filter.value) &&
                        filter.value.length === 0
                    ) {
                        filterUpdates[filter.id] = null; // Remove from URL
                    } else if (Array.isArray(filter.value)) {
                        filterUpdates[filter.id] = filter.value.join(',');
                    } else {
                        filterUpdates[filter.id] = filter.value;
                    }
                }
            });

            // Remove filters that are no longer present
            filterableColumns.forEach((column) => {
                if (!filters.some((filter) => filter.id === column.id)) {
                    filterUpdates[column.id ?? ''] = null;
                }
            });

            console.log('Filter updates for URL:', filterUpdates);

            updateUrl({
                ...filterUpdates,
                [PAGE_KEY]: 1, // Reset to page 1 when filtering
            });
        },
        debounceMs,
    );

    const onColumnFiltersChange = React.useCallback(
        (updaterOrValue: Updater<ColumnFiltersState>) => {
            console.log('Column filters change triggered');

            setColumnFilters((prev) => {
                const next =
                    typeof updaterOrValue === 'function'
                        ? updaterOrValue(prev)
                        : updaterOrValue;

                console.log('Previous filters:', prev);
                console.log('Next filters:', next);

                debouncedUpdateFilters(next);
                return next;
            });
        },
        [debouncedUpdateFilters],
    );

    const table = useReactTable({
        ...tableProps,
        data, // This was missing - critical!
        columns,
        initialState: {
            ...initialState,
            columnFilters, // Make sure this is set
        },
        state: {
            columnFilters, // This controls the filter state
            pagination,
            sorting,
            columnVisibility,
            rowSelection,
        },
        pageCount,
        defaultColumn: {
            ...tableProps.defaultColumn,
            enableColumnFilter: false,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onPaginationChange,
        onSortingChange,
        onColumnFiltersChange, // This handler updates columnFilters state
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: false, // Change this to false for client-side filtering
    });

    console.log('Table state:', {
        rows: table.getRowModel().rows.length,
        columnFilters: table.getState().columnFilters,
        filteredRows: table.getFilteredRowModel().rows.length,
    });

    return { table };
}
