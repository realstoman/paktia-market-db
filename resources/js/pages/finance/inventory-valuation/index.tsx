'use client';

import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem } from '@/types';
import { formatAfn, formatNumber, formatPrice } from '@/utils/format';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Package, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Inventory Valuation', href: '/finance/inventory-valuation' },
];

const RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
] as const;

interface InventoryValuationFilters {
    range: string;
    startDate: string;
    endDate: string;
    branchId: number | null;
}

interface InventoryValuationItem {
    id: number;
    name: string;
    branch: string;
    vendor: string;
    quantity: number;
    unit: string;
    averageCost: number;
    stockValue: number;
    currencySymbol: string;
}

interface MovementEntry {
    id: number;
    date: string;
    action: string;
    itemName: string;
    branch: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    weightedAverageCostAfter: number | null;
    note: string | null;
}

interface InventoryValuationPageProps {
    branches: Branch[];
    filters: InventoryValuationFilters;
    summary: {
        inventoryValue: number;
        stockItems: number;
        stockQuantity: number;
        cogs: number;
        wastage: number;
        adjustmentIn: number;
        adjustmentOut: number;
    };
    valuationItems: InventoryValuationItem[];
    movementEntries: MovementEntry[];
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
        from: number | null;
        to: number | null;
        hasMorePages: boolean;
    };
}

function buildPageNumbers(currentPage: number, lastPage: number) {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, lastPage]);

    for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        if (page > 1 && page < lastPage) {
            pages.add(page);
        }
    }

    if (currentPage <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
    }

    if (currentPage >= lastPage - 2) {
        pages.add(lastPage - 1);
        pages.add(lastPage - 2);
        pages.add(lastPage - 3);
    }

    return [...pages]
        .filter((page) => page >= 1 && page <= lastPage)
        .sort((left, right) => left - right);
}

function submitFilters(filters: {
    range: string;
    startDate: string;
    endDate: string;
    branchId: string;
}) {
    const params: Record<string, string> = {
        range: filters.range,
    };

    if (filters.range === 'custom') {
        params.start_date = filters.startDate;
        params.end_date = filters.endDate;
    }

    if (filters.branchId) {
        params.branch_id = filters.branchId;
    }

    React.startTransition(() => {
        router.get('/finance/inventory-valuation', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    });
}

export default function InventoryValuationPage({
    branches,
    filters,
    summary,
    valuationItems,
    movementEntries,
    pagination,
}: InventoryValuationPageProps) {
    const [range, setRange] = React.useState(filters.range);
    const [startDate, setStartDate] = React.useState(filters.startDate);
    const [endDate, setEndDate] = React.useState(filters.endDate);
    const [branchId, setBranchId] = React.useState(
        filters.branchId ? String(filters.branchId) : '',
    );

    React.useEffect(() => {
        setRange(filters.range);
        setStartDate(filters.startDate);
        setEndDate(filters.endDate);
        setBranchId(filters.branchId ? String(filters.branchId) : '');
    }, [filters]);

    const visiblePages = React.useMemo(
        () => buildPageNumbers(pagination.currentPage, pagination.lastPage),
        [pagination.currentPage, pagination.lastPage],
    );

    const goToPage = (page: number) => {
        const params: Record<string, string> = {
            range,
            page: String(page),
        };

        if (range === 'custom') {
            params.start_date = startDate;
            params.end_date = endDate;
        }

        if (branchId) {
            params.branch_id = branchId;
        }

        React.startTransition(() => {
            router.get('/finance/inventory-valuation', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Valuation" />

            <div className="space-y-6 py-2">
                <section className="rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f5f8f2_0%,#ffffff_55%,#edf7ef_100%)] p-6 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#111827_0%,#10211a_55%,#0f172a_100%)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                Finance Module
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                Inventory Valuation
                            </h1>
                            <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                This page shows what the restaurant stock is worth, how much value
                                moved into kitchen usage, what has been adjusted, and how inventory
                                costs are affecting finance.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/finance">Back to Finance</Link>
                        </Button>
                    </div>
                </section>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Review valuation by period and branch.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {RANGE_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    variant={range === option.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setRange(option.value);
                                        if (option.value !== 'custom') {
                                            submitFilters({
                                                range: option.value,
                                                startDate,
                                                endDate,
                                                branchId,
                                            });
                                        }
                                    }}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {range === 'custom' ? (
                                <>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(event) => setStartDate(event.target.value)}
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(event) => setEndDate(event.target.value)}
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                    </div>
                                </>
                            ) : null}

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Branch</label>
                                <SearchableDropdown
                                    value={branchId || 'all'}
                                    options={[
                                        { value: 'all', label: 'All Branches' },
                                        ...branches.map((branch) => ({
                                            value: String(branch.id),
                                            label: branch.name,
                                        })),
                                    ]}
                                    onValueChange={(value) =>
                                        setBranchId(value === 'all' ? '' : value)
                                    }
                                    placeholder="Select branch"
                                    searchPlaceholder="Search branches..."
                                    emptyText="No branch found."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={() =>
                                    submitFilters({
                                        range,
                                        startDate,
                                        endDate,
                                        branchId,
                                    })
                                }
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                    Inventory Value
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(summary.inventoryValue)}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Current stock value across selected branches
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                    Stock on Hand
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(summary.stockQuantity)}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Across {formatNumber(summary.stockItems)} inventory items
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <Package className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                    COGS / Usage
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(summary.cogs)}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Estimated value moved into usage in this period
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                    Adjustments Net
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(summary.adjustmentIn - summary.adjustmentOut)}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    In: {formatAfn(summary.adjustmentIn)} | Out: {formatAfn(summary.adjustmentOut)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>Valuation by Item</CardTitle>
                            <CardDescription>
                                Weighted or estimated average cost per inventory item and current stock value.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {valuationItems.length > 0 ? (
                                valuationItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="grid gap-3 rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800 md:grid-cols-[1.3fr_0.9fr_0.7fr_0.8fr]"
                                    >
                                        <div>
                                            <p className="font-medium text-neutral-950 dark:text-neutral-50">
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {item.branch} | Vendor: {item.vendor}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                                Quantity
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {formatNumber(item.quantity)} {item.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                                Avg Cost
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {item.currencySymbol} {formatPrice(item.averageCost)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                                Stock Value
                                            </p>
                                            <p className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
                                                {formatAfn(item.stockValue)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                    No inventory valuation items were found for the selected branch.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>Cost Sections</CardTitle>
                            <CardDescription>
                                Finance view of consumption, wastage, and adjustments in the selected period.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950/40">
                                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                    COGS / Usage
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatAfn(summary.cogs)}
                                </p>
                                <p className="mt-2 text-sm text-neutral-500">
                                    Based on `usage_cycle` and any future `issue` or `consumed` transactions.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950/40">
                                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                    Wastage / Spoilage
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatAfn(summary.wastage)}
                                </p>
                                <p className="mt-2 text-sm text-neutral-500">
                                    This stays zero until wastage transactions are added explicitly into the inventory flow.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950/40">
                                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                    Adjustments
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatAfn(summary.adjustmentIn - summary.adjustmentOut)}
                                </p>
                                <p className="mt-2 text-sm text-neutral-500">
                                    Positive adjustments: {formatAfn(summary.adjustmentIn)} | Negative adjustments: {formatAfn(summary.adjustmentOut)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>Movement History</CardTitle>
                        <CardDescription>
                            Inventory finance movements and cost impact history.
                            {pagination.total > 0
                                ? ` Showing ${pagination.from} to ${pagination.to} of ${pagination.total} movements.`
                                : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {movementEntries.length > 0 ? (
                            movementEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="grid gap-3 rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800 md:grid-cols-[0.9fr_0.9fr_1.3fr_0.8fr_0.8fr_1fr]"
                                >
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                            Date
                                        </p>
                                        <p className="mt-1 font-medium">{entry.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                            Action
                                        </p>
                                        <p className="mt-1 font-medium">{entry.action}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-neutral-950 dark:text-neutral-50">
                                            {entry.itemName}
                                        </p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {entry.branch}
                                        </p>
                                        {entry.note ? (
                                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                                {entry.note}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                            Quantity
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {formatNumber(entry.quantity)} {entry.unit}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                            Unit Cost
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {formatAfn(entry.unitCost)}
                                        </p>
                                        {entry.weightedAverageCostAfter !== null ? (
                                            <p className="text-xs text-neutral-500">
                                                WA after: {formatAfn(entry.weightedAverageCostAfter)}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                                            Total Cost
                                        </p>
                                        <p className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
                                            {formatAfn(entry.totalCost)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                No inventory finance movements were found for the selected filters.
                            </div>
                        )}

                        {pagination.lastPage > 1 ? (
                            <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Page {pagination.currentPage} of {pagination.lastPage}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.currentPage <= 1}
                                        onClick={() => goToPage(pagination.currentPage - 1)}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {visiblePages.map((page, index) => {
                                        const previousPage = visiblePages[index - 1];
                                        const showGap =
                                            previousPage !== undefined &&
                                            page - previousPage > 1;

                                        return (
                                            <React.Fragment key={page}>
                                                {showGap ? (
                                                    <span className="px-1 text-sm text-neutral-400">
                                                        ...
                                                    </span>
                                                ) : null}
                                                <Button
                                                    variant={
                                                        page === pagination.currentPage
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() => goToPage(page)}
                                                >
                                                    {page}
                                                </Button>
                                            </React.Fragment>
                                        );
                                    })}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination.hasMorePages}
                                        onClick={() => goToPage(pagination.currentPage + 1)}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
