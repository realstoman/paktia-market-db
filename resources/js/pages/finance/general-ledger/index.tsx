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
import { Property, BreadcrumbItem } from '@/types';
import { formatAfn } from '@/utils/format';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

const RANGE_VALUES = [
    'today',
    'yesterday',
    'this_week',
    'this_month',
    'custom',
] as const;

const PAYMENT_METHOD_VALUES = [
    'cash',
    'bank_transfer',
    'credit_card',
    'other',
] as const;

interface LedgerFilters {
    range: string;
    startDate: string;
    endDate: string;
    propertyId: number | null;
    paymentMethod: string | null;
    category: string | null;
}

interface LedgerEntry {
    date: string;
    reference: string;
    type: string;
    property: string;
    account: string;
    description: string;
    debit: number;
    credit: number;
    status: string;
}

interface GeneralLedgerPageProps {
    properties: Property[];
    filters: LedgerFilters;
    expenseCategories: Array<{
        value: string;
        label: string;
    }>;
    entries: LedgerEntry[];
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

function ledgerStatusTone(status: string) {
    if (
        status.toLowerCase() === 'posted' ||
        status.toLowerCase() === 'approved'
    ) {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status.toLowerCase() === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

function localizeLedgerStatus(
    status: string,
    t: (key: string, fallback?: string) => string,
) {
    const normalized = status.toLowerCase();

    if (normalized === 'posted') {
        return t('financeDashboard.generalLedger.status.posted', 'Posted');
    }

    if (normalized === 'approved') {
        return t('financeDashboard.generalLedger.status.approved', 'Approved');
    }

    if (normalized === 'submitted') {
        return t(
            'financeDashboard.generalLedger.status.submitted',
            'Submitted',
        );
    }

    return status;
}

function submitFilters(filters: {
    range: string;
    startDate: string;
    endDate: string;
    propertyId: string;
    paymentMethod: string;
    category: string;
}) {
    const params: Record<string, string> = {
        range: filters.range,
    };

    if (filters.range === 'custom') {
        params.start_date = filters.startDate;
        params.end_date = filters.endDate;
    }

    if (filters.propertyId) {
        params.property_id = filters.propertyId;
    }

    if (filters.paymentMethod) {
        params.payment_method = filters.paymentMethod;
    }

    if (filters.category) {
        params.category = filters.category;
    }

    React.startTransition(() => {
        router.get('/finance/general-ledger', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    });
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

export default function GeneralLedgerPage({
    properties,
    filters,
    expenseCategories,
    entries,
    pagination,
}: GeneralLedgerPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t('financeGeneralLedger.pageTitle', 'General Ledger'),
            href: '/finance/general-ledger',
        },
    ];
    const [range, setRange] = React.useState(filters.range);
    const [startDate, setStartDate] = React.useState(filters.startDate);
    const [endDate, setEndDate] = React.useState(filters.endDate);
    const [propertyId, setPropertyId] = React.useState(
        filters.propertyId ? String(filters.propertyId) : '',
    );
    const propertyOptions = React.useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );
    const [paymentMethod, setPaymentMethod] = React.useState(
        filters.paymentMethod ?? '',
    );
    const [category, setCategory] = React.useState(filters.category ?? '');
    const rangeOptions = RANGE_VALUES.map((value) => ({
        value,
        label: t(
            `financeDashboard.filters.range.${value}`,
            value.replace('_', ' '),
        ),
    }));
    const paymentMethods = PAYMENT_METHOD_VALUES.map((value) => ({
        value,
        label: t(`paymentMethods.${value}`, value.replace('_', ' ')),
    }));

    React.useEffect(() => {
        setRange(filters.range);
        setStartDate(filters.startDate);
        setEndDate(filters.endDate);
        setPropertyId(filters.propertyId ? String(filters.propertyId) : '');
        setPaymentMethod(filters.paymentMethod ?? '');
        setCategory(filters.category ?? '');
    }, [filters]);

    useAutoSelectSingleOption(propertyOptions, propertyId, setPropertyId);

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

        if (propertyId) {
            params.property_id = propertyId;
        }

        if (paymentMethod) {
            params.payment_method = paymentMethod;
        }

        if (category) {
            params.category = category;
        }

        React.startTransition(() => {
            router.get('/finance/general-ledger', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t('financeGeneralLedger.pageTitle', 'General Ledger')}
            />

            <div className="space-y-6 py-2">
                <section className="rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#eef6ff_100%)] p-6 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#10243a_100%)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                {t(
                                    'financeGeneralLedger.hero.eyebrow',
                                    'Finance Module',
                                )}
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                {t(
                                    'financeGeneralLedger.hero.title',
                                    'General Ledger',
                                )}
                            </h1>
                            <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                {t(
                                    'financeGeneralLedger.hero.description',
                                    'This is the full finance ledger page. It shows the growing stream of sales, expenses, cash movements, and posted journal lines in one place, so the dashboard can stay focused on summary analytics.',
                                )}
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/finance">
                                {t(
                                    'financeGeneralLedger.actions.backToFinance',
                                    'Back to Finance',
                                )}
                            </Link>
                        </Button>
                    </div>
                </section>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>
                            {t('financeGeneralLedger.filters.title', 'Filters')}
                        </CardTitle>
                        <CardDescription>
                            {t(
                                'financeGeneralLedger.filters.description',
                                'Narrow the ledger by period, property, payment method, and expense category.',
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
                                                propertyId,
                                                paymentMethod,
                                                category,
                                            });
                                        }
                                    }}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            {range === 'custom' ? (
                                <>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            {t(
                                                'financeDashboard.filters.startDate',
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
                                                'financeDashboard.filters.endDate',
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
                                        'financeDashboard.filters.property',
                                        'Property',
                                    )}
                                </label>
                                <SearchableDropdown
                                    value={propertyId || 'all'}
                                    options={[
                                        {
                                            value: 'all',
                                            label: t(
                                                'financeDashboard.filters.allProperties',
                                                'All Properties',
                                            ),
                                        },
                                        ...properties.map((property) => ({
                                            value: String(property.id),
                                            label: property.name,
                                        })),
                                    ]}
                                    onValueChange={(value) =>
                                        setPropertyId(
                                            value === 'all' ? '' : value,
                                        )
                                    }
                                    placeholder={t(
                                        'financeGeneralLedger.filters.selectProperty',
                                        'Select property',
                                    )}
                                    searchPlaceholder={t(
                                        'financeDashboard.filters.searchProperties',
                                        'Search properties...',
                                    )}
                                    emptyText={t(
                                        'financeGeneralLedger.filters.noPropertyFound',
                                        'No property found.',
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    {t(
                                        'financeDashboard.filters.paymentMethod',
                                        'Payment Method',
                                    )}
                                </label>
                                <SearchableDropdown
                                    value={paymentMethod || 'all'}
                                    options={[
                                        {
                                            value: 'all',
                                            label: t(
                                                'financeDashboard.filters.allMethods',
                                                'All Methods',
                                            ),
                                        },
                                        ...paymentMethods,
                                    ]}
                                    onValueChange={(value) =>
                                        setPaymentMethod(
                                            value === 'all' ? '' : value,
                                        )
                                    }
                                    placeholder={t(
                                        'financeGeneralLedger.filters.selectPaymentMethod',
                                        'Select payment method',
                                    )}
                                    searchPlaceholder={t(
                                        'financeGeneralLedger.filters.searchPaymentMethods',
                                        'Search payment methods...',
                                    )}
                                    emptyText={t(
                                        'financeGeneralLedger.filters.noMethodFound',
                                        'No method found.',
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    {t(
                                        'financeDashboard.filters.expenseCategory',
                                        'Expense Category',
                                    )}
                                </label>
                                <SearchableDropdown
                                    value={category || 'all'}
                                    options={[
                                        {
                                            value: 'all',
                                            label: t(
                                                'financeDashboard.filters.allCategories',
                                                'All Categories',
                                            ),
                                        },
                                        ...expenseCategories,
                                    ]}
                                    onValueChange={(value) =>
                                        setCategory(
                                            value === 'all' ? '' : value,
                                        )
                                    }
                                    placeholder={t(
                                        'financeGeneralLedger.filters.selectCategory',
                                        'Select category',
                                    )}
                                    searchPlaceholder={t(
                                        'financeGeneralLedger.filters.searchCategories',
                                        'Search categories...',
                                    )}
                                    emptyText={t(
                                        'financeGeneralLedger.filters.noCategoryFound',
                                        'No category found.',
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
                                        propertyId,
                                        paymentMethod,
                                        category,
                                    })
                                }
                            >
                                {t(
                                    'financeDashboard.filters.apply',
                                    'Apply Filters',
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>
                            {t(
                                'financeGeneralLedger.entries.title',
                                'Ledger Entries',
                            )}
                        </CardTitle>
                        <CardDescription>
                            {t(
                                'financeGeneralLedger.entries.description',
                                'Full operational finance stream for the selected filters.',
                            )}
                            {pagination.total > 0
                                ? t(
                                      'financeGeneralLedger.entries.summary',
                                      ' Showing :from to :to of :total entries.',
                                  )
                                      .replace(':from', String(pagination.from))
                                      .replace(':to', String(pagination.to))
                                      .replace(':total', String(pagination.total))
                                : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {entries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-200 text-left text-xs tracking-[0.18em] text-neutral-500 uppercase dark:border-neutral-800">
                                            <th className="px-3 py-3">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.date',
                                                    'Date',
                                                )}
                                            </th>
                                            <th className="px-3 py-3">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.reference',
                                                    'Reference',
                                                )}
                                            </th>
                                            <th className="px-3 py-3">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.type',
                                                    'Type',
                                                )}
                                            </th>
                                            <th className="px-3 py-3">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.property',
                                                    'Property',
                                                )}
                                            </th>
                                            <th className="px-3 py-3">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.account',
                                                    'Account',
                                                )}
                                            </th>
                                            <th className="px-3 py-3">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.description',
                                                    'Description',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-right">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.debit',
                                                    'Debit',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-right">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.credit',
                                                    'Credit',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-right">
                                                {t(
                                                    'financeDashboard.generalLedger.columns.status',
                                                    'Status',
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map((entry) => (
                                            <tr
                                                key={`${entry.reference}-${entry.date}-${entry.account}`}
                                                className="border-b border-neutral-100 dark:border-neutral-800/70"
                                            >
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {entry.date}
                                                </td>
                                                <td className="px-3 py-3 font-medium whitespace-nowrap text-neutral-950 dark:text-neutral-50">
                                                    {entry.reference}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {entry.type}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {entry.property}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {entry.account}
                                                </td>
                                                <td className="px-3 py-3 text-neutral-600 dark:text-neutral-300">
                                                    {entry.description}
                                                </td>
                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    {entry.debit > 0
                                                        ? formatAfn(entry.debit)
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    {entry.credit > 0
                                                        ? formatAfn(
                                                              entry.credit,
                                                          )
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${ledgerStatusTone(entry.status)}`}
                                                    >
                                                        {localizeLedgerStatus(
                                                            entry.status,
                                                            t,
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                {t(
                                    'financeGeneralLedger.entries.empty',
                                    'No ledger entries were found for the selected filters.',
                                )}
                            </div>
                        )}

                        {pagination.lastPage > 1 ? (
                            <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {t(
                                        'financeGeneralLedger.pagination.pageOf',
                                        'Page :current of :last',
                                    )
                                        .replace(
                                            ':current',
                                            String(pagination.currentPage),
                                        )
                                        .replace(
                                            ':last',
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
                                            'common.previousPage',
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
                                            'common.nextPage',
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
