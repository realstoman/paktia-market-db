'use client';

import React from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    FilterFn
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from './input';
import { Button } from './button';
import { ScrollArea, ScrollBar } from './scroll-area';
import { ArrowLeft, ArrowRight, Loader2, MoreHorizontal } from 'lucide-react';
// import { useLocale, useTranslations } from 'next-intl';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey: string[];
    isLoading: boolean;
}

// Custom filter function that handles dot notation
const nestedPropertyFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
    if (!filterValue) return true;

    // Helper function to get nested property value
    const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => {
            return acc && acc[part];
        }, obj);
    };

    // Get the value from the nested property
    const value = getNestedValue(row.original, columnId);

    // Convert to string for comparison
    const safeValue = value ? String(value).toLowerCase() : '';
    const safeFilterValue = filterValue
        ? String(filterValue).toLowerCase()
        : '';

    return safeValue.includes(safeFilterValue);
};

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    isLoading
}: DataTableProps<TData, TValue>) {
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10
    });

    const [globalFilter, setGlobalFilter] = React.useState('');

    // Create columns with filterFn for searchKey columns
    const columnsWithFilter = React.useMemo(() => {
        return columns.map((column) => {
            // If this column is in searchKey, apply the custom filter function
            if (searchKey.includes(column.id as string)) {
                return {
                    ...column,
                    filterFn: nestedPropertyFilterFn
                };
            }
            return column;
        });
    }, [columns, searchKey]);

    const table = useReactTable({
        data,
        columns: columnsWithFilter,
        state: {
            pagination,
            globalFilter
        },
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: 'auto' // or use a custom global filter function
    });

    // const t = useTranslations('DataTable');
    // const activeLanguage = useLocale();
    // const layoutDirection =
    //     activeLanguage === 'ps' || activeLanguage === 'da' ? 'rtl' : 'ltr';
    const currentPage = table.getState().pagination.pageIndex + 1;
    const pageCount = table.getPageCount();

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (pageCount <= maxPagesToShow) {
            for (let i = 1; i <= pageCount; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', pageCount);
            } else if (currentPage >= pageCount - 2) {
                pages.push(
                    1,
                    '...',
                    pageCount - 3,
                    pageCount - 2,
                    pageCount - 1,
                    pageCount
                );
            } else {
                pages.push(
                    1,
                    '...',
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    '...',
                    pageCount
                );
            }
        }
        return pages;
    };

    return (
        <div>
            {/* Search input - Now using global filter */}
            <Input
                placeholder="Search..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="mt-3 w-full"
            />

            {/* Scrollable table */}
            <ScrollArea
                className="mt-3 h-[calc(80vh-100%)] w-full overflow-x-scroll overflow-y-auto rounded-md border bg-white pr-6 text-right sm:overflow-x-auto md:h-[calc(80dvh-100%)] dark:border-neutral-800 dark:bg-neutral-900"
                dir="rtl"
            >
                <Table className="relative overflow-x-scroll text-right sm:overflow-x-auto">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-start text-lg rtl:pr-2"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={100}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center gap-4">
                                        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                                        <span className="text-muted-foreground text-lg">
                                            د ښودلو په حال کې...
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="text-start rtl:pr-2"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Not Found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Footer pagination */}
            <div className="left-0 flex items-center justify-between py-4">
                <div className="text-md text-muted-foreground flex-1">
                    {table.getFilteredSelectedRowModel().rows.length}{' '}
                    Selected from{' '}
                    {table.getFilteredRowModel().rows.length} Selected
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="gap-2"
                    >
                        <ArrowRight className="h-5 w-5" />
                        Prev
                    </Button>

                    {getPageNumbers().map((page, idx) =>
                        page === '...' ? (
                            <MoreHorizontal
                                key={idx}
                                className="h-5 w-5 opacity-50"
                            />
                        ) : (
                            <Button
                                key={idx}
                                variant={
                                    page === currentPage ? 'default' : 'outline'
                                }
                                size="sm"
                                className={`flex items-center justify-center border px-4 text-center text-lg ${
                                    page === currentPage
                                        ? 'bg-mota text-white hover:bg-sky-600'
                                        : 'bg-white text-black'
                                }`}
                                onClick={() =>
                                    table.setPageIndex((page as number) - 1)
                                }
                            >
                                {page}
                            </Button>
                        )
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="gap-2"
                    >
                        Next
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
