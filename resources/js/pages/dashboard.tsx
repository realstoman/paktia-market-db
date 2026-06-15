import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { type BreadcrumbItem } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpLeft,
    Banknote,
    Boxes,
    ChevronLeft,
    CircleDollarSign,
    PackageCheck,
    Search,
    UsersRound,
    WalletCards,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DashboardData {
    inventory: null | {
        totalItems: number;
        lowStockItems: number;
        outOfStockItems: number;
        inventoryValue: number;
        lowStockQuickList: Array<{
            id: number;
            name: string;
            quantity: number;
            unit?: string | null;
            branch: string;
        }>;
    };
    finance: null | {
        expenses: number;
        cashPosition: number;
        unpaidPayroll: number;
        pendingExpenses: number;
        trend: Array<{
            period: string;
            value: number;
        }>;
        recentExpenses: Array<{
            id: number;
            title: string;
            amount: number;
            date: string;
            status: string;
            branch: string;
        }>;
    };
}

function SummaryCard({
    title,
    value,
    icon: Icon,
    primary = false,
    tone,
}: {
    title: string;
    value: string;
    icon: typeof Boxes;
    primary?: boolean;
    tone: 'blue' | 'green' | 'rose';
}) {
    const iconTone = {
        blue: 'bg-white/15 text-white',
        green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
        rose: 'bg-rose-50 text-rose-500 dark:bg-rose-500/10',
    }[tone];

    return (
        <div
            className={`flex min-h-28 items-center gap-4 rounded-[24px] border p-5 shadow-sm transition-transform hover:-translate-y-0.5 ${
                primary
                    ? 'border-[#1858f2] bg-[#1858f2] text-white shadow-blue-600/20'
                    : 'border-white bg-white text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white'
            }`}
        >
            <div
                className={`flex size-16 shrink-0 items-center justify-center rounded-2xl ${iconTone}`}
            >
                <Icon className="size-7" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
                <p
                    className={`text-sm ${primary ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'}`}
                >
                    {title}
                </p>
                <p className="mt-1 truncate text-xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function EmptyState({ children }: { children: string }) {
    return (
        <div className="flex min-h-40 items-center justify-center rounded-2xl bg-neutral-50 px-5 text-center text-sm text-neutral-500 dark:bg-neutral-950/60">
            {children}
        </div>
    );
}

export default function Dashboard({ data }: { data: DashboardData }) {
    const { locale, t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboardPage.title', 'Dashboard'),
            href: '/dashboard',
        },
    ];
    const inventory = data.inventory;
    const finance = data.finance;
    const chartLocale =
        locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US';
    const chartData = (finance?.trend ?? []).map((point) => ({
        label: new Intl.DateTimeFormat(chartLocale, {
            month: 'short',
        }).format(new Date(`${point.period}-01T00:00:00`)),
        value: point.value,
    }));
    const rankedItems = inventory?.lowStockQuickList.slice(0, 6) ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboardPage.title', 'Dashboard')} />

            <div className="min-h-full rounded-[28px] bg-[#f5f6f8] p-4 sm:p-5 xl:p-6 dark:bg-neutral-950">
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                            {t(
                                'dashboardPage.welcome',
                                'Welcome to Paktiawal Group',
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {t(
                                'dashboardPage.subtitle',
                                'A complete view of market operations and finances.',
                            )}
                        </p>
                    </div>
                    <div className="flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 shadow-sm xl:max-w-md dark:bg-neutral-900">
                        <Search className="size-5 text-neutral-400" />
                        <input
                            aria-label={t('dashboardPage.search', 'Search')}
                            placeholder={t(
                                'dashboardPage.searchPlaceholder',
                                'Search branches, inventory and finance...',
                            )}
                            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                        />
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0 space-y-5">
                        <section className="grid gap-4 md:grid-cols-3">
                            <SummaryCard
                                title={t(
                                    'dashboardPage.cards.inventoryItems',
                                    'Inventory items',
                                )}
                                value={formatNumber(inventory?.totalItems ?? 0)}
                                icon={Boxes}
                                tone="blue"
                                primary
                            />
                            <SummaryCard
                                title={t(
                                    'dashboardPage.cards.inventoryValue',
                                    'Inventory value',
                                )}
                                value={`${formatPrice(inventory?.inventoryValue ?? 0)} ؋`}
                                icon={PackageCheck}
                                tone="green"
                            />
                            <SummaryCard
                                title={t(
                                    'dashboardPage.cards.approvedExpenses',
                                    'Approved expenses',
                                )}
                                value={`${formatPrice(finance?.expenses ?? 0)} ؋`}
                                icon={Banknote}
                                tone="rose"
                            />
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-[26px] bg-white p-5 shadow-sm dark:bg-neutral-900">
                                <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
                                    <div>
                                        <h2 className="font-bold text-neutral-950 dark:text-white">
                                            {t(
                                                'dashboardPage.finance.title',
                                                'Latest expenses',
                                            )}
                                        </h2>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            {t(
                                                'dashboardPage.finance.subtitle',
                                                'Recent financial activity',
                                            )}
                                        </p>
                                    </div>
                                    <Link
                                        href="/finance/expenses"
                                        className="flex items-center gap-1 text-sm font-semibold text-[#1858f2]"
                                    >
                                        {t('dashboardPage.showAll', 'Show all')}
                                        <ChevronLeft className="size-4" />
                                    </Link>
                                </div>
                                <div className="mt-3 space-y-1">
                                    {finance?.recentExpenses.length ? (
                                        finance.recentExpenses
                                            .slice(0, 4)
                                            .map((expense) => (
                                                <div
                                                    key={expense.id}
                                                    className="flex items-center justify-between gap-4 rounded-2xl px-2 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/70"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1858f2] dark:bg-blue-500/10">
                                                            <ArrowUpLeft className="size-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold">
                                                                {expense.title}
                                                            </p>
                                                            <p className="truncate text-xs text-neutral-500">
                                                                {expense.branch}{' '}
                                                                · {expense.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="shrink-0 font-bold">
                                                        {formatPrice(
                                                            expense.amount,
                                                        )}{' '}
                                                        ؋
                                                    </p>
                                                </div>
                                            ))
                                    ) : (
                                        <EmptyState>
                                            {t(
                                                'dashboardPage.finance.empty',
                                                'No expenses recorded yet.',
                                            )}
                                        </EmptyState>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex min-h-28 items-center justify-between rounded-[26px] bg-white p-5 shadow-sm dark:bg-neutral-900">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                                            <AlertTriangle className="size-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-500">
                                                {t(
                                                    'dashboardPage.attention.title',
                                                    'Needs attention',
                                                )}
                                            </p>
                                            <p className="mt-1 font-bold">
                                                {formatNumber(
                                                    (inventory?.lowStockItems ??
                                                        0) +
                                                        (inventory?.outOfStockItems ??
                                                            0),
                                                )}{' '}
                                                {t(
                                                    'dashboardPage.attention.items',
                                                    'items',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/inventory"
                                        className="text-sm font-semibold text-[#1858f2]"
                                    >
                                        {t('dashboardPage.details', 'Details')}
                                    </Link>
                                </div>

                                <div className="rounded-[26px] bg-white p-5 shadow-sm dark:bg-neutral-900">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-bold">
                                            {t(
                                                'dashboardPage.obligations.title',
                                                'Financial obligations',
                                            )}
                                        </h2>
                                        <CircleDollarSign className="size-5 text-[#1858f2]" />
                                    </div>
                                    <div className="mt-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-neutral-500">
                                                {t(
                                                    'dashboardPage.obligations.payroll',
                                                    'Unpaid payroll',
                                                )}
                                            </span>
                                            <strong>
                                                {formatPrice(
                                                    finance?.unpaidPayroll ?? 0,
                                                )}{' '}
                                                ؋
                                            </strong>
                                        </div>
                                        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-neutral-500">
                                                {t(
                                                    'dashboardPage.obligations.pending',
                                                    'Pending expenses',
                                                )}
                                            </span>
                                            <strong>
                                                {formatNumber(
                                                    finance?.pendingExpenses ??
                                                        0,
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[26px] bg-white p-5 shadow-sm dark:bg-neutral-900">
                            <div className="flex flex-col gap-2 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                                <div>
                                    <h2 className="font-bold">
                                        {t(
                                            'dashboardPage.chart.title',
                                            'Financial overview',
                                        )}
                                    </h2>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        {t(
                                            'dashboardPage.chart.subtitle',
                                            'Operational value trend',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700">
                                    {t(
                                        'dashboardPage.chart.period',
                                        'Current period',
                                    )}
                                </div>
                            </div>
                            <div className="mt-5 h-[300px] w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 15,
                                            right: 10,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="dashboardValue"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="4%"
                                                    stopColor="#1858f2"
                                                    stopOpacity={0.32}
                                                />
                                                <stop
                                                    offset="96%"
                                                    stopColor="#1858f2"
                                                    stopOpacity={0.02}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            vertical={false}
                                            stroke="#eceef2"
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fill: '#9ca3af',
                                                fontSize: 11,
                                            }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            width={70}
                                            tick={{
                                                fill: '#9ca3af',
                                                fontSize: 11,
                                            }}
                                            tickFormatter={(value) =>
                                                formatNumber(value)
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [
                                                `${formatPrice(value)} ؋`,
                                                t(
                                                    'dashboardPage.chart.value',
                                                    'Value',
                                                ),
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#1858f2"
                                            strokeWidth={3}
                                            fill="url(#dashboardValue)"
                                            activeDot={{
                                                r: 6,
                                                fill: '#1858f2',
                                                stroke: '#fff',
                                                strokeWidth: 3,
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </main>

                    <aside className="rounded-[26px] bg-white p-5 shadow-sm dark:bg-neutral-900">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div>
                                <h2 className="font-bold">
                                    {t(
                                        'dashboardPage.stock.title',
                                        'Inventory status',
                                    )}
                                </h2>
                                <p className="mt-1 text-xs text-neutral-500">
                                    {t(
                                        'dashboardPage.stock.subtitle',
                                        'Items that need attention',
                                    )}
                                </p>
                            </div>
                            <Boxes className="size-5 text-[#1858f2]" />
                        </div>
                        <div className="mt-4 space-y-3">
                            {rankedItems.length ? (
                                rankedItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 rounded-2xl border border-neutral-100 p-3 dark:border-neutral-800"
                                    >
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-xs font-bold text-neutral-500 dark:bg-neutral-800">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {item.name}
                                            </p>
                                            <p className="truncate text-xs text-neutral-500">
                                                {item.branch}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-sm font-bold text-[#1858f2]">
                                            {formatNumber(item.quantity)}{' '}
                                            {item.unit}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <EmptyState>
                                    {t(
                                        'dashboardPage.stock.empty',
                                        'Inventory levels look healthy.',
                                    )}
                                </EmptyState>
                            )}
                        </div>

                        <div className="mt-6 rounded-[22px] bg-[#f4f7ff] p-5 dark:bg-blue-500/10">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#1858f2] shadow-sm dark:bg-neutral-900">
                                <WalletCards className="size-6" />
                            </div>
                            <p className="mt-4 text-sm text-neutral-500">
                                {t(
                                    'dashboardPage.cash.title',
                                    'Current cash position',
                                )}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-neutral-950 dark:text-white">
                                {formatPrice(finance?.cashPosition ?? 0)} ؋
                            </p>
                            <Link
                                href="/finance/cash-bank"
                                className="mt-5 flex h-11 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950"
                            >
                                {t(
                                    'dashboardPage.cash.action',
                                    'Manage finances',
                                )}
                            </Link>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/70">
                                <UsersRound className="size-5 text-emerald-500" />
                                <p className="mt-3 text-xs text-neutral-500">
                                    {t('dashboardPage.stock.low', 'Low stock')}
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                    {formatNumber(
                                        inventory?.lowStockItems ?? 0,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/70">
                                <AlertTriangle className="size-5 text-rose-500" />
                                <p className="mt-3 text-xs text-neutral-500">
                                    {t(
                                        'dashboardPage.stock.out',
                                        'Out of stock',
                                    )}
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                    {formatNumber(
                                        inventory?.outOfStockItems ?? 0,
                                    )}
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
