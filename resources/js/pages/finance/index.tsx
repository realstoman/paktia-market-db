'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    BookOpenText,
    Building2,
    ChartNoAxesCombined,
    Coins,
    CreditCard,
    Package,
    ReceiptText,
    Users,
    Wallet,
} from 'lucide-react';
import React from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Finance',
        href: '/finance',
    },
];

const RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
] as const;

const PAYMENT_METHODS = [
    'Cash',
    'Bank Transfer',
    'Credit Card',
    'Mobile Money',
    'Other',
];

const PIE_COLORS = [
    '#14532d',
    '#15803d',
    '#65a30d',
    '#f59e0b',
    '#f97316',
    '#b91c1c',
];

interface FinanceFilters {
    range: string;
    startDate: string;
    endDate: string;
    branchId: number | null;
    paymentMethod: string | null;
    category: string | null;
}

interface FinanceDashboardData {
    summary: {
        sales: number;
        expenses: number;
        grossProfit: number | null;
        netProfit: number;
        cashPosition: number;
        unpaidSalaries: number;
        inventoryValue: number;
        supplierBalances: number;
    };
    trend: Array<{
        date: string;
        label: string;
        sales: number;
        expenses: number;
        net: number;
    }>;
    branchRevenue: Array<{
        branch: string;
        revenue: number;
    }>;
    topExpenseCategories: Array<{
        value: string;
        category: string;
        amount: number;
    }>;
    paymentBreakdown: Array<{
        method: string;
        amount: number;
    }>;
    ledgerStats: {
        accounts: number;
        journals: number;
        draft_journals: number;
        approval_queue: number;
    };
    modules: Array<{
        name: string;
        description: string;
        status: string;
    }>;
    notes: {
        grossProfit: string;
        cashPosition: string;
    };
}

interface FinancePageProps {
    branches: Branch[];
    filters: FinanceFilters;
    expenseCategories: Array<{
        value: string;
        label: string;
    }>;
    dashboard: FinanceDashboardData;
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
        router.get('/finance', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    });
}

function statusTone(status: string) {
    if (status === 'Ready') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'Needs upgrade') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

function SummaryCard({
    title,
    value,
    subtitle,
    icon,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
}) {
    return (
        <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
            <CardContent className="flex items-start justify-between p-5">
                <div className="space-y-2">
                    <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                        {title}
                    </p>
                    <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                        {value}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {subtitle}
                    </p>
                </div>
                <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

export default function FinancePage({
    branches,
    filters,
    expenseCategories,
    dashboard,
}: FinancePageProps) {
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
            <Head title="Finance Dashboard" />

            <div className="space-y-6 py-2">
                <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] p-6 shadow-none dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_45%,#0b2a1f_100%)]">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300/70 bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.24em] text-neutral-600 uppercase dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
                                <ChartNoAxesCombined className="h-3.5 w-3.5" />
                                Finance Dashboard
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                    Financial control center for revenue,
                                    payroll, expenses, inventory, and cash.
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                    This is the finance dashboard which is
                                    designed around the accounting foundation:
                                    chart of accounts, ledger postings, payroll,
                                    advances, cash movements, and inventory
                                    valuation.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:min-w-[420px]">
                            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                                <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                    Ledger Accounts
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(
                                        dashboard.ledgerStats.accounts,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                                <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                    Approval Queue
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(
                                        dashboard.ledgerStats.approval_queue,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="space-y-2">
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Slice the finance dashboard by period, branch,
                            payment method, and expense category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {RANGE_OPTIONS.map((option) => (
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
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                    Branch
                                </p>
                                <Select
                                    value={branchId || '__all__'}
                                    onValueChange={(value) =>
                                        setBranchId(
                                            value === '__all__' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All branches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">
                                            All branches
                                        </SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem
                                                key={branch.id}
                                                value={String(branch.id)}
                                            >
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                    Payment Method
                                </p>
                                <Select
                                    value={paymentMethod || '__all__'}
                                    onValueChange={(value) =>
                                        setPaymentMethod(
                                            value === '__all__' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">
                                            All methods
                                        </SelectItem>
                                        {PAYMENT_METHODS.map((method) => (
                                            <SelectItem
                                                key={method}
                                                value={method}
                                            >
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                    Expense Category
                                </p>
                                <Select
                                    value={category || '__all__'}
                                    onValueChange={(value) =>
                                        setCategory(
                                            value === '__all__' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">
                                            All categories
                                        </SelectItem>
                                        {expenseCategories.map((expense) => (
                                            <SelectItem
                                                key={expense.value}
                                                value={expense.value}
                                            >
                                                {expense.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                    Start Date
                                </p>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) =>
                                        setStartDate(event.target.value)
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    disabled={range !== 'custom'}
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                    End Date
                                </p>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(event) =>
                                        setEndDate(event.target.value)
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    disabled={range !== 'custom'}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
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
                            <Button
                                variant="outline"
                                onClick={() =>
                                    submitFilters({
                                        range: 'today',
                                        startDate: filters.startDate,
                                        endDate: filters.endDate,
                                        branchId: '',
                                        paymentMethod: '',
                                        category: '',
                                    })
                                }
                            >
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Sales"
                        value={formatAfn(dashboard.summary.sales)}
                        subtitle="Completed order revenue in selected period"
                        icon={<Banknote className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title="Expenses"
                        value={formatAfn(dashboard.summary.expenses)}
                        subtitle="Recorded operational expenses"
                        icon={<ReceiptText className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title="Gross Profit"
                        value={
                            dashboard.summary.grossProfit === null
                                ? 'Pending'
                                : formatAfn(dashboard.summary.grossProfit)
                        }
                        subtitle={dashboard.notes.grossProfit}
                        icon={<ArrowUpRight className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title="Net Profit"
                        value={formatAfn(dashboard.summary.netProfit)}
                        subtitle="Sales minus expenses, before unposted finance adjustments"
                        icon={<ArrowDownRight className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title="Cash Position"
                        value={formatAfn(dashboard.summary.cashPosition)}
                        subtitle={dashboard.notes.cashPosition}
                        icon={<Wallet className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title="Unpaid Salaries"
                        value={formatAfn(dashboard.summary.unpaidSalaries)}
                        subtitle="Outstanding payroll liabilities"
                        icon={<Users className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title="Inventory Value"
                        value={formatAfn(dashboard.summary.inventoryValue)}
                        subtitle="Current stock value from quantity and unit cost"
                        icon={<Package className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title="Supplier Balances"
                        value={formatAfn(dashboard.summary.supplierBalances)}
                        subtitle="Unpaid vendor balance from stock purchases"
                        icon={<CreditCard className="h-5 w-5" />}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                Revenue, Expense, and Operating Result
                            </CardTitle>
                            <CardDescription>
                                Daily trend for the selected finance window.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboard.trend}>
                                        <defs>
                                            <linearGradient
                                                id="finance-sales"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#14532d"
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#14532d"
                                                    stopOpacity={0.04}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="finance-expenses"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#b91c1c"
                                                    stopOpacity={0.28}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#b91c1c"
                                                    stopOpacity={0.04}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) =>
                                                formatNumber(Number(value))
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatAfn(value)
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#14532d"
                                            fill="url(#finance-sales)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expenses"
                                            stroke="#b91c1c"
                                            fill="url(#finance-expenses)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>Payment Breakdown</CardTitle>
                            <CardDescription>
                                Collected payment volume by method.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {dashboard.paymentBreakdown.length ? (
                                dashboard.paymentBreakdown.map((item) => (
                                    <div
                                        key={item.method}
                                        className="flex items-center justify-between rounded-2xl border border-neutral-200/80 px-4 py-3 dark:border-neutral-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-xl bg-neutral-950 p-2 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                                <Coins className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {item.method}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    Payment source
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {formatAfn(item.amount)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                    No payment data is available for the
                                    selected filters.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>Branch-wise Revenue</CardTitle>
                            <CardDescription>
                                Compare completed order revenue by branch.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboard.branchRevenue}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="branch"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) =>
                                                formatNumber(Number(value))
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatAfn(value)
                                            }
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="#14532d"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>Top Expense Categories</CardTitle>
                            <CardDescription>
                                Expense concentration in the selected period.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 lg:grid-cols-[180px_1fr]">
                            <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={
                                                dashboard.topExpenseCategories
                                            }
                                            dataKey="amount"
                                            nameKey="category"
                                            innerRadius={48}
                                            outerRadius={72}
                                            paddingAngle={3}
                                        >
                                            {dashboard.topExpenseCategories.map(
                                                (_, index) => (
                                                    <Cell
                                                        key={`expense-${index}`}
                                                        fill={
                                                            PIE_COLORS[
                                                                index %
                                                                    PIE_COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatAfn(value)
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                {dashboard.topExpenseCategories.length ? (
                                    dashboard.topExpenseCategories.map(
                                        (item, index) => (
                                            <div
                                                key={item.category}
                                                className="flex items-center justify-between rounded-2xl border border-neutral-200/80 px-4 py-3 dark:border-neutral-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="h-3 w-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                PIE_COLORS[
                                                                    index %
                                                                        PIE_COLORS.length
                                                                ],
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatAfn(item.amount)}
                                                </span>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                        No expense categories were found for the
                                        selected filters.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>Ledger Readiness</CardTitle>
                            <CardDescription>
                                Finance backbone progress inside the current
                                system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        Accounts
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats.accounts,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        Journals
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats.journals,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        Draft Journals
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats
                                                .draft_journals,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        Approval Queue
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats
                                                .approval_queue,
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                                The new finance schema is designed so sales,
                                expenses, payroll, stock usage, and manual cash
                                movements can all post into one structured
                                ledger. The next implementation step is posting
                                automation, not more manual totals.
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>Finance Modules</CardTitle>
                            <CardDescription>
                                Core modules planned from your architecture.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            {dashboard.modules.map((module) => (
                                <div
                                    key={module.name}
                                    className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-2">
                                            <p className="font-medium text-neutral-950 dark:text-neutral-50">
                                                {module.name}
                                            </p>
                                            <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                                                {module.description}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(module.status)}`}
                                        >
                                            {module.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <BookOpenText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    Chart of Accounts
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Assets, liabilities, equity, revenue, COGS,
                                    and expenses
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    Branch-wise Control
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Consolidated reporting with branch-level
                                    filters and balances
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <Coins className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    Cash & Bank
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Cash drawers, deposits, petty cash, and
                                    manual movements
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    Inventory Valuation
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Weighted average costing for stock value and
                                    COGS
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
