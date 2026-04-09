import React, {
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useLocalization } from '@/lib/localization';
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
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../button';
import { Input } from '../input';
import { ScrollArea, ScrollBar } from '../scroll-area';
import { Skeleton } from '../skeleton';
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

function TableRowsSkeleton({ columnCount }: { columnCount: number }) {
    return Array.from({ length: 8 }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
            {Array.from({ length: columnCount }).map((__, cellIndex) => (
                <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`}>
                    <Skeleton
                        className={
                            cellIndex === 0
                                ? 'h-4 w-32'
                                : cellIndex === columnCount - 1
                                  ? 'h-4 w-14'
                                  : 'h-4 w-24'
                        }
                    />
                </TableCell>
            ))}
        </TableRow>
    ));
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey = [],
    isLoading = false,
    searchPlaceholder = 'Search...',
    toolbar,
}: DataTableProps<TData, TValue>) {
    const { t, isRtl } = useLocalization();
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
    const selectedRowsText = t(
        'common.rowsSelected',
        ':selected of :total row(s) selected.',
    )
        .replace(':selected', String(selectedRowCount))
        .replace(':total', String(filteredRowCount));

    return (
        <div className="space-y-4">
            <div
                className={`flex flex-wrap items-start justify-between gap-3 ${
                    isRtl ? 'flex-row-reverse' : ''
                }`}
            >
                <Input
                    placeholder={searchPlaceholder}
                    value={searchInput}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchInput(event.target.value)
                    }
                    className={`h-10 w-full max-w-[250px] border border-neutral-200/60 dark:border-neutral-900/80 ${
                        isRtl ? 'text-right' : ''
                    }`}
                />
                {toolbar ? (
                    <div className={isRtl ? 'mr-auto' : 'ml-auto'}>
                        {toolbar}
                    </div>
                ) : null}
            </div>

            <ScrollArea className="h-[calc(80vh-220px)] rounded-md border border-neutral-200/60 dark:border-neutral-900/80">
                <Table
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={
                        isRtl
                            ? 'pr-2 [&_th]:text-right [&_td]:text-right'
                            : ''
                    }
                >
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
                            <TableRowsSkeleton columnCount={columns.length} />
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
                                    {t(
                                        'common.noResultsFound',
                                        'No results found.',
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div
                className={`flex items-center justify-between ${
                    isRtl ? 'flex-row-reverse' : ''
                }`}
            >
                <div className="text-sm text-muted-foreground">
                    {selectedRowsText}
                </div>

                <div
                    className={`flex items-center gap-2 ${
                        isRtl ? 'flex-row-reverse' : ''
                    }`}
                >
                    <Button
                        variant="outline"
                        className='h-9 w-9 text-center flex items-center justify-center cursor-pointer'
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        aria-label={t('common.previousPage', 'Previous page')}
                    >
                        {isRtl ? (
                            <ChevronRight className="h-[20px] w-[20px] dark:text-neutral-300" />
                        ) : (
                            <ChevronLeft className="h-[20px] w-[20px] dark:text-neutral-300" />
                        )}
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
                        aria-label={t('common.nextPage', 'Next page')}
                    >
                        {isRtl ? (
                            <ChevronLeft className="h-[20px] w-[20px] dark:text-neutral-300" />
                        ) : (
                            <ChevronRight className="h-[20px] w-[20px] dark:text-neutral-300" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
