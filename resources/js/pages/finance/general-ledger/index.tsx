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
import { formatAfn } from '@/utils/format';
import { Head, Link, router } from '@inertiajs/react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'General Ledger', href: '/finance/general-ledger' },
];

const RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
] as const;

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' },
];

interface LedgerFilters {
    range: string;
    startDate: string;
    endDate: string;
    branchId: number | null;
    paymentMethod: string | null;
    category: string | null;
}

interface LedgerEntry {
    date: string;
    reference: string;
    type: string;
    branch: string;
    account: string;
    description: string;
    debit: number;
    credit: number;
    status: string;
}

interface GeneralLedgerPageProps {
    branches: Branch[];
    filters: LedgerFilters;
    expenseCategories: Array<{
        value: string;
        label: string;
    }>;
    entries: LedgerEntry[];
}

function ledgerStatusTone(status: string) {
    if (status.toLowerCase() === 'posted' || status.toLowerCase() === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status.toLowerCase() === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

function submitFilters(filters: {
    range: string;
    startDate: string;
    endDate: string;
    branchId: string;
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

    if (filters.branchId) {
        params.branch_id = filters.branchId;
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

export default function GeneralLedgerPage({
    branches,
    filters,
    expenseCategories,
    entries,
}: GeneralLedgerPageProps) {
    const [range, setRange] = React.useState(filters.range);
    const [startDate, setStartDate] = React.useState(filters.startDate);
    const [endDate, setEndDate] = React.useState(filters.endDate);
    const [branchId, setBranchId] = React.useState(
        filters.branchId ? String(filters.branchId) : '',
    );
    const [paymentMethod, setPaymentMethod] = React.useState(
        filters.paymentMethod ?? '',
    );
    const [category, setCategory] = React.useState(filters.category ?? '');

    React.useEffect(() => {
        setRange(filters.range);
        setStartDate(filters.startDate);
        setEndDate(filters.endDate);
        setBranchId(filters.branchId ? String(filters.branchId) : '');
        setPaymentMethod(filters.paymentMethod ?? '');
        setCategory(filters.category ?? '');
    }, [filters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="General Ledger" />

            <div className="space-y-6 py-2">
                <section className="rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#eef6ff_100%)] p-6 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#10243a_100%)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                Finance Module
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                General Ledger
                            </h1>
                            <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                This is the full finance ledger page. It shows the growing stream
                                of sales, expenses, cash movements, and posted journal lines in one place,
                                so the dashboard can stay focused on summary analytics.
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
                            Narrow the ledger by period, branch, payment method, and expense category.
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

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Payment Method</label>
                                <SearchableDropdown
                                    value={paymentMethod || 'all'}
                                    options={[
                                        { value: 'all', label: 'All Methods' },
                                        ...PAYMENT_METHODS,
                                    ]}
                                    onValueChange={(value) =>
                                        setPaymentMethod(value === 'all' ? '' : value)
                                    }
                                    placeholder="Select payment method"
                                    searchPlaceholder="Search payment methods..."
                                    emptyText="No method found."
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Expense Category</label>
                                <SearchableDropdown
                                    value={category || 'all'}
                                    options={[
                                        { value: 'all', label: 'All Categories' },
                                        ...expenseCategories,
                                    ]}
                                    onValueChange={(value) =>
                                        setCategory(value === 'all' ? '' : value)
                                    }
                                    placeholder="Select category"
                                    searchPlaceholder="Search categories..."
                                    emptyText="No category found."
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
                                        paymentMethod,
                                        category,
                                    })
                                }
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>Ledger Entries</CardTitle>
                        <CardDescription>
                            Full operational finance stream for the selected filters.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {entries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-200 text-left text-xs tracking-[0.18em] text-neutral-500 uppercase dark:border-neutral-800">
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Reference</th>
                                            <th className="px-3 py-3">Type</th>
                                            <th className="px-3 py-3">Branch</th>
                                            <th className="px-3 py-3">Account</th>
                                            <th className="px-3 py-3">Description</th>
                                            <th className="px-3 py-3 text-right">Debit</th>
                                            <th className="px-3 py-3 text-right">Credit</th>
                                            <th className="px-3 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map((entry) => (
                                            <tr
                                                key={`${entry.reference}-${entry.date}-${entry.account}`}
                                                className="border-b border-neutral-100 dark:border-neutral-800/70"
                                            >
                                                <td className="px-3 py-3 whitespace-nowrap">{entry.date}</td>
                                                <td className="px-3 py-3 whitespace-nowrap font-medium text-neutral-950 dark:text-neutral-50">
                                                    {entry.reference}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">{entry.type}</td>
                                                <td className="px-3 py-3 whitespace-nowrap">{entry.branch}</td>
                                                <td className="px-3 py-3 whitespace-nowrap">{entry.account}</td>
                                                <td className="px-3 py-3 text-neutral-600 dark:text-neutral-300">
                                                    {entry.description}
                                                </td>
                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    {entry.debit > 0 ? formatAfn(entry.debit) : '-'}
                                                </td>
                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    {entry.credit > 0 ? formatAfn(entry.credit) : '-'}
                                                </td>
                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${ledgerStatusTone(entry.status)}`}
                                                    >
                                                        {entry.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                No ledger entries were found for the selected filters.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
