import React, {
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ColumnDef,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '../button';
import { Input } from '../input';
import { ScrollArea, ScrollBar } from '../scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../table';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string[];
    isLoading?: boolean;
    searchPlaceholder?: string;
    toolbar?: React.ReactNode;
}

const pathSegmentsCache = new Map<string, string[]>();

function getPathSegments(path: string): string[] {
    const cached = pathSegmentsCache.get(path);

    if (cached) {
        return cached;
    }

    const segments = path.split('.');
    pathSegmentsCache.set(path, segments);

    return segments;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return getPathSegments(path).reduce((acc: Record<string, unknown> | unknown, part) => {
        if (acc && typeof acc === 'object' && part in acc) {
            return (acc as Record<string, unknown>)[part];
        }

        return null;
    }, obj);
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey = [],
    isLoading = false,
    searchPlaceholder = 'Search...',
    toolbar,
}: DataTableProps<TData, TValue>) {
    const [searchInput, setSearchInput] = useState('');
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const deferredGlobalFilter = useDeferredValue(searchInput.trim().toLowerCase());

    const searchableKeys = useMemo(
        () => (searchKey.length > 0 ? searchKey : columns.map((column) => String(column.id ?? ''))),
        [columns, searchKey],
    );

    const globalFilterFn = useMemo<FilterFn<TData>>(
        () => (row, _columnId, filterValue) => {
            if (!filterValue) {
                return true;
            }

            const original = row.original as Record<string, unknown>;
            const normalizedFilter = String(filterValue);

            return searchableKeys.some((key) => {
                if (!key) {
                    return false;
                }

                const value = getNestedValue(original, key);
                return value !== null && String(value).toLowerCase().includes(normalizedFilter);
            });
        },
        [searchableKeys],
    );

    useEffect(() => {
        setPagination((current) =>
            current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
        );
    }, [deferredGlobalFilter]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: {
            pagination,
            globalFilter: deferredGlobalFilter,
            sorting,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        globalFilterFn,
    });

    const rows = table.getRowModel().rows;
    const filteredRowCount = table.getFilteredRowModel().rows.length;
    const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
    const currentPage = pagination.pageIndex + 1;
    const pageCount = table.getPageCount();
    const pageNumbers = useMemo((): (number | string)[] => {
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
    }, [currentPage, pageCount]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <Input
                    placeholder={searchPlaceholder}
                    value={searchInput}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchInput(event.target.value)
                    }
                    className="h-10 w-full max-w-[250px] border border-neutral-200/60 dark:border-neutral-900/80"
                />
                {toolbar ? (
                    <div className="ml-auto">{toolbar}</div>
                ) : null}
            </div>

            <ScrollArea className="h-[calc(80vh-220px)] rounded-md border border-neutral-200/60 dark:border-neutral-900/80">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className='dark:text-neutral-300 border-b border-neutral-200/60 dark:border-neutral-900/50'>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
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
                                    colSpan={columns.length}
                                    className="h-24 text-center dark:text-neutral-100"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            Loading...
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : rows.length ? (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className='dark:text-neutral-100'>
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
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {selectedRowCount} of {filteredRowCount} row(s) selected.
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className='h-9 w-9 text-center flex items-center justify-center cursor-pointer'
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-[20px] w-[20px] dark:text-neutral-300" />
                    </Button>

                    {pageNumbers.map((page, idx) =>
                        page === '...' ? (
                            <MoreHorizontal
                                key={idx}
                                className="h-4 w-4 opacity-50"
                            />
                        ) : (
                            <Button
                                key={idx}
                                    variant={page === currentPage ? 'default' : 'outline'}
                                    className='h-9 w-9 text-center flex items-center justify-center cursor-pointer'
                                size="sm"
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
                        className='h-9 w-9 text-center flex items-center justify-center cursor-pointer'
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >

                        <ChevronRight className="h-[20px] w-[20px] dark:text-neutral-300" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
