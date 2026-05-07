'use client';

import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Branch, BreadcrumbItem } from '@/types';
import { formatAfn, formatNumber, formatPrice } from '@/utils/format';
import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Package,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import React from 'react';

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
    const { t } = useLocalization();
    const [range, setRange] = React.useState(filters.range);
    const [startDate, setStartDate] = React.useState(filters.startDate);
    const [endDate, setEndDate] = React.useState(filters.endDate);
    const [branchId, setBranchId] = React.useState(
        filters.branchId ? String(filters.branchId) : '',
    );
    const branchOptions = React.useMemo(
        () =>
            branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        [branches],
    );

    React.useEffect(() => {
        setRange(filters.range);
        setStartDate(filters.startDate);
        setEndDate(filters.endDate);
        setBranchId(filters.branchId ? String(filters.branchId) : '');
    }, [filters]);

    useAutoSelectSingleOption(branchOptions, branchId, setBranchId);

    const visiblePages = React.useMemo(
        () => buildPageNumbers(pagination.currentPage, pagination.lastPage),
        [pagination.currentPage, pagination.lastPage],
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t(
                'financeInventoryValuation.pageTitle',
                'Inventory Valuation',
            ),
            href: '/finance/inventory-valuation',
        },
    ];

    const rangeOptions = [
        {
            value: 'today',
            label: t('financeInventoryValuation.ranges.today', 'Today'),
        },
        {
            value: 'yesterday',
            label: t(
                'financeInventoryValuation.ranges.yesterday',
                'Yesterday',
            ),
        },
        {
            value: 'this_week',
            label: t(
                'financeInventoryValuation.ranges.thisWeek',
                'This Week',
            ),
        },
        {
            value: 'this_month',
            label: t(
                'financeInventoryValuation.ranges.thisMonth',
                'This Month',
            ),
        },
        {
            value: 'custom',
            label: t('financeInventoryValuation.ranges.custom', 'Custom'),
        },
    ] as const;

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
            <Head
                title={t(
                    'financeInventoryValuation.pageTitle',
                    'Inventory Valuation',
                )}
            />

            <div className="space-y-6 py-2">
                <section className="rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f5f8f2_0%,#ffffff_55%,#edf7ef_100%)] p-6 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#111827_0%,#10211a_55%,#0f172a_100%)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                {t(
                                    'financeInventoryValuation.hero.eyebrow',
                                    'Finance Module',
                                )}
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                {t(
                                    'financeInventoryValuation.hero.title',
                                    'Inventory Valuation',
                                )}
                            </h1>
                            <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                {t(
                                    'financeInventoryValuation.hero.description',
                                    'This page shows what the restaurant stock is worth, how much value moved into kitchen usage, what has been adjusted, and how inventory costs are affecting finance.',
                                )}
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/finance">
                                {t(
                                    'financeInventoryValuation.actions.backToFinance',
                                    'Back to Finance',
                                )}
                            </Link>
                        </Button>
                    </div>
                </section>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>
                            {t(
                                'financeInventoryValuation.filters.title',
                                'Filters',
                            )}
                        </CardTitle>
                        <CardDescription>
                            {t(
                                'financeInventoryValuation.filters.description',
                                'Review valuation by period and branch.',
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {rangeOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    variant={
                                        range === option.value
                                            ? 'default'
                                            : 'outline'
                                    }
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
                                        <label className="text-sm font-medium">
                                            {t(
                                                'financeInventoryValuation.filters.startDate',
                                                'Start Date',
                                            )}
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(event) =>
                                                setStartDate(event.target.value)
                                            }
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            {t(
                                                'financeInventoryValuation.filters.endDate',
                                                'End Date',
                                            )}
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(event) =>
                                                setEndDate(event.target.value)
                                            }
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                    </div>
                                </>
                            ) : null}

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    {t(
                                        'financeInventoryValuation.filters.branch',
                                        'Branch',
                                    )}
                                </label>
                                <SearchableDropdown
                                    value={branchId || 'all'}
                                    options={[
                                        {
                                            value: 'all',
                                            label: t(
                                                'financeInventoryValuation.filters.allBranches',
                                                'All Branches',
                                            ),
                                        },
                                        ...branches.map((branch) => ({
                                            value: String(branch.id),
                                            label: branch.name,
                                        })),
                                    ]}
                                    onValueChange={(value) =>
                                        setBranchId(
                                            value === 'all' ? '' : value,
                                        )
                                    }
                                    placeholder={t(
                                        'financeInventoryValuation.filters.selectBranch',
                                        'Select branch',
                                    )}
                                    searchPlaceholder={t(
                                        'financeInventoryValuation.filters.searchBranches',
                                        'Search branches...',
                                    )}
                                    emptyText={t(
                                        'financeInventoryValuation.filters.noBranchFound',
                                        'No branch found.',
                                    )}
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
                                {t(
                                    'financeInventoryValuation.actions.applyFilters',
                                    'Apply Filters',
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                    {t(
                                        'financeInventoryValuation.summary.inventoryValue',
                                        'Inventory Value',
                                    )}
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(summary.inventoryValue)}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {t(
                                        'financeInventoryValuation.summary.inventoryValueDescription',
                                        'Current stock value across selected branches',
                                    )}
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
                                    {t(
                                        'financeInventoryValuation.summary.stockOnHand',
                                        'Stock on Hand',
                                    )}
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(summary.stockQuantity)}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {t(
                                        'financeInventoryValuation.summary.stockOnHandDescription',
                                        'Across :count inventory items',
                                    ).replace(
                                        ':count',
                                        formatNumber(summary.stockItems),
                                    )}
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
                                    {t(
                                        'financeInventoryValuation.summary.cogs',
                                        'COGS / Usage',
                                    )}
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(summary.cogs)}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {t(
                                        'financeInventoryValuation.summary.cogsDescription',
                                        'Estimated value moved into usage in this period',
                                    )}
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
                                    {t(
                                        'financeInventoryValuation.summary.adjustmentsNet',
                                        'Adjustments Net',
                                    )}
                                </p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(
                                        summary.adjustmentIn -
                                            summary.adjustmentOut,
                                    )}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {t(
                                        'financeInventoryValuation.summary.adjustmentsNetDescription',
                                        'In: :in | Out: :out',
                                    )
                                        .replace(
                                            ':in',
                                            formatAfn(summary.adjustmentIn),
                                        )
                                        .replace(
                                            ':out',
                                            formatAfn(summary.adjustmentOut),
                                        )}
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
                            <CardTitle>
                                {t(
                                    'financeInventoryValuation.valuation.title',
                                    'Valuation by Item',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeInventoryValuation.valuation.description',
                                    'Weighted or estimated average cost per inventory item and current stock value.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {valuationItems.length > 0 ? (
                                valuationItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="grid gap-3 rounded-2xl border border-neutral-200/80 p-4 md:grid-cols-[1.3fr_0.9fr_0.7fr_0.8fr] dark:border-neutral-800"
                                    >
                                        <div>
                                            <p className="font-medium text-neutral-950 dark:text-neutral-50">
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {t(
                                                    'financeInventoryValuation.valuation.branchVendor',
                                                    ':branch | Vendor: :vendor',
                                                )
                                                    .replace(
                                                        ':branch',
                                                        item.branch,
                                                    )
                                                    .replace(
                                                        ':vendor',
                                                        item.vendor,
                                                    )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                                {t(
                                                    'financeInventoryValuation.valuation.quantity',
                                                    'Quantity',
                                                )}
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {formatNumber(item.quantity)}{' '}
                                                {item.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                                {t(
                                                    'financeInventoryValuation.valuation.avgCost',
                                                    'Avg Cost',
                                                )}
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {item.currencySymbol}{' '}
                                                {formatPrice(item.averageCost)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                                {t(
                                                    'financeInventoryValuation.valuation.stockValue',
                                                    'Stock Value',
                                                )}
                                            </p>
                                            <p className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
                                                {formatAfn(item.stockValue)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                    {t(
                                        'financeInventoryValuation.valuation.empty',
                                        'No inventory valuation items were found for the selected branch.',
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'financeInventoryValuation.costSections.title',
                                    'Cost Sections',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeInventoryValuation.costSections.description',
                                    'Finance view of consumption, wastage, and adjustments in the selected period.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950/40">
                                <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                    {t(
                                        'financeInventoryValuation.costSections.cogs',
                                        'COGS / Usage',
                                    )}
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatAfn(summary.cogs)}
                                </p>
                                <p className="mt-2 text-sm text-neutral-500">
                                    {t(
                                        'financeInventoryValuation.costSections.cogsDescription',
                                        'Based on `usage_cycle` and any future `issue` or `consumed` transactions.',
                                    )}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950/40">
                                <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                    {t(
                                        'financeInventoryValuation.costSections.wastage',
                                        'Wastage / Spoilage',
                                    )}
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatAfn(summary.wastage)}
                                </p>
                                <p className="mt-2 text-sm text-neutral-500">
                                    {t(
                                        'financeInventoryValuation.costSections.wastageDescription',
                                        'This stays zero until wastage transactions are added explicitly into the inventory flow.',
                                    )}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950/40">
                                <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                    {t(
                                        'financeInventoryValuation.costSections.adjustments',
                                        'Adjustments',
                                    )}
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {formatAfn(
                                        summary.adjustmentIn -
                                            summary.adjustmentOut,
                                    )}
                                </p>
                                <p className="mt-2 text-sm text-neutral-500">
                                    {t(
                                        'financeInventoryValuation.costSections.adjustmentsDescription',
                                        'Positive adjustments: :in | Negative adjustments: :out',
                                    )
                                        .replace(
                                            ':in',
                                            formatAfn(summary.adjustmentIn),
                                        )
                                        .replace(
                                            ':out',
                                            formatAfn(summary.adjustmentOut),
                                        )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>
                            {t(
                                'financeInventoryValuation.movements.title',
                                'Movement History',
                            )}
                        </CardTitle>
                        <CardDescription>
                            {t(
                                'financeInventoryValuation.movements.description',
                                'Inventory finance movements and cost impact history.',
                            )}
                            {pagination.total > 0
                                ? ` ${t(
                                      'financeInventoryValuation.movements.showing',
                                      'Showing :from to :to of :total movements.',
                                  )
                                      .replace(
                                          ':from',
                                          String(pagination.from ?? ''),
                                      )
                                      .replace(
                                          ':to',
                                          String(pagination.to ?? ''),
                                      )
                                      .replace(
                                          ':total',
                                          String(pagination.total),
                                      )}`
                                : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {movementEntries.length > 0 ? (
                            movementEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="grid gap-3 rounded-2xl border border-neutral-200/80 p-4 md:grid-cols-[0.9fr_0.9fr_1.3fr_0.8fr_0.8fr_1fr] dark:border-neutral-800"
                                >
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                            {t(
                                                'financeInventoryValuation.movements.date',
                                                'Date',
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {entry.date}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                            {t(
                                                'financeInventoryValuation.movements.action',
                                                'Action',
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {entry.action}
                                        </p>
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
                                        <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                            {t(
                                                'financeInventoryValuation.movements.quantity',
                                                'Quantity',
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {formatNumber(entry.quantity)}{' '}
                                            {entry.unit}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                            {t(
                                                'financeInventoryValuation.movements.unitCost',
                                                'Unit Cost',
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {formatAfn(entry.unitCost)}
                                        </p>
                                        {entry.weightedAverageCostAfter !==
                                        null ? (
                                            <p className="text-xs text-neutral-500">
                                                {t(
                                                    'financeInventoryValuation.movements.waAfter',
                                                    'WA after:',
                                                )}{' '}
                                                {formatAfn(
                                                    entry.weightedAverageCostAfter,
                                                )}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                                            {t(
                                                'financeInventoryValuation.movements.totalCost',
                                                'Total Cost',
                                            )}
                                        </p>
                                        <p className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
                                            {formatAfn(entry.totalCost)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                {t(
                                    'financeInventoryValuation.movements.empty',
                                    'No inventory finance movements were found for the selected filters.',
                                )}
                            </div>
                        )}

                        {pagination.lastPage > 1 ? (
                            <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {t(
                                        'financeInventoryValuation.pagination.pageOf',
                                        'Page :page of :total',
                                    )
                                        .replace(
                                            ':page',
                                            String(pagination.currentPage),
                                        )
                                        .replace(
                                            ':total',
                                            String(pagination.lastPage),
                                        )}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.currentPage <= 1}
                                        onClick={() =>
                                            goToPage(pagination.currentPage - 1)
                                        }
                                        aria-label={t(
                                            'financeInventoryValuation.pagination.previousPage',
                                            'Previous page',
                                        )}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {visiblePages.map((page, index) => {
                                        const previousPage =
                                            visiblePages[index - 1];
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
                                                        page ===
                                                        pagination.currentPage
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        goToPage(page)
                                                    }
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
                                        onClick={() =>
                                            goToPage(pagination.currentPage + 1)
                                        }
                                        aria-label={t(
                                            'financeInventoryValuation.pagination.nextPage',
                                            'Next page',
                                        )}
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
