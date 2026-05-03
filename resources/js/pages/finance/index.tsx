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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Branch, BreadcrumbItem, SharedData } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    BookOpenText,
    Building2,
    ChartNoAxesCombined,
    Check,
    Coins,
    CreditCard,
    ExternalLink,
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
        employeeCoveredTotal: number;
        houseCompTotal: number;
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
    coverageComparison: Array<{
        label: string;
        amount: number;
        tone: 'sales' | 'employee' | 'house' | string;
    }>;
    ledgerStats: {
        accounts: number;
        journals: number;
        draft_journals: number;
        approval_queue: number;
    };
    generalLedger: Array<{
        date: string;
        reference: string;
        type: string;
        branch: string;
        account: string;
        description: string;
        debit: number;
        credit: number;
        status: string;
    }>;
    generalLedgerPreview: Array<{
        date: string;
        reference: string;
        type: string;
        branch: string;
        account: string;
        description: string;
        debit: number;
        credit: number;
        status: string;
    }>;
    modules: Array<{
        name: string;
        description: string;
        status: string;
        stats?: Array<{
            label: string;
            value: number;
            format: 'currency' | 'number';
        }>;
    }>;
    notes: {
        grossProfit: string;
        cashPosition: string;
    };
}

interface ProjectionHealth {
    usesProjectionData: boolean;
    status: 'healthy' | 'warning' | 'critical' | 'unavailable';
    message: string;
    latestProjectionAt?: string | null;
    staleBranchCount: number;
    criticalBranchCount: number;
    warningBranchCount: number;
    branches: Array<{
        branchId: number;
        branchName: string;
        status: string;
        message: string;
        latestSourceAt?: string | null;
        latestProjectionAt?: string | null;
        latestMetricDate?: string | null;
        lagMinutes?: number | null;
    }>;
}

interface FinancePageProps {
    branches: Branch[];
    filters: FinanceFilters;
    expenseCategories: Array<{
        value: string;
        label: string;
    }>;
    projectionHealth: ProjectionHealth;
    dashboard: FinanceDashboardData;
}

function projectionTone(status: ProjectionHealth['status']) {
    if (status === 'healthy') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200';
    }

    if (status === 'warning') {
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200';
    }

    if (status === 'critical') {
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200';
    }

    return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-200';
}

function localizeProjectionMessage(
    message: string,
    t: (key: string, fallback?: string) => string,
) {
    const messageMap: Record<string, string> = {
        'Projection data is current for the selected finance view.': t(
            'financeDashboard.projection.message.current',
            'Projection data is current for the selected finance view.',
        ),
        'Some branch projections are lagging behind the selected finance window.': t(
            'financeDashboard.projection.message.lagging',
            'Some branch projections are lagging behind the selected finance window.',
        ),
        'Projection data is stale. Finance metrics may be outdated until projections refresh.': t(
            'financeDashboard.projection.message.stale',
            'Projection data is stale. Finance metrics may be outdated until projections refresh.',
        ),
        'Projection status is unavailable right now. Finance metrics are falling back to transactional reads.': t(
            'financeDashboard.projection.message.unavailable',
            'Projection status is unavailable right now. Finance metrics are falling back to transactional reads.',
        ),
    };

    return messageMap[message] ?? message;
}

function localizeFinanceNote(
    note: string,
    t: (key: string, fallback?: string) => string,
) {
    const notesMap: Record<string, string> = {
        'Recognized using recorded sales minus average inventory cost.': t(
            'financeDashboard.notes.grossProfitRecognized',
            'Recognized using recorded sales minus average inventory cost.',
        ),
        'Inventory costing data is still unavailable, so gross profit is pending until stock valuation coverage is complete.': t(
            'financeDashboard.notes.grossProfitPending',
            'Inventory costing data is still unavailable, so gross profit is pending until stock valuation coverage is complete.',
        ),
        'Cash position is a running balance from all-time cash sales (including legacy completed orders without payment rows), cash expenses, and approved cash movements. Date filters do not reduce this balance.': t(
            'financeDashboard.notes.cashPosition',
            'Cash position is a running balance from all-time cash sales (including legacy completed orders without payment rows), cash expenses, and approved cash movements. Date filters do not reduce this balance.',
        ),
    };

    return notesMap[note] ?? note;
}

function localizeModuleName(
    name: string,
    t: (key: string, fallback?: string) => string,
) {
    const nameMap: Record<string, string> = {
        'Chart of Accounts': t(
            'financeDashboard.modules.names.chartOfAccounts',
            'Chart of Accounts',
        ),
        'General Ledger': t(
            'financeDashboard.modules.names.generalLedger',
            'General Ledger',
        ),
        Expenses: t('financeDashboard.modules.names.expenses', 'Expenses'),
        Payroll: t('financeDashboard.modules.names.payroll', 'Payroll'),
        'Employee Advances': t(
            'financeDashboard.modules.names.employeeAdvances',
            'Employee Advances',
        ),
        'Cash & Bank': t(
            'financeDashboard.modules.names.cashBank',
            'Cash & Bank',
        ),
        'Inventory Valuation': t(
            'financeDashboard.modules.names.inventoryValuation',
            'Inventory Valuation',
        ),
    };

    return nameMap[name] ?? name;
}

function localizeModuleDescription(
    description: string,
    t: (key: string, fallback?: string) => string,
) {
    const descriptionMap: Record<string, string> = {
        'Foundation for assets, liabilities, equity, revenue, COGS, and expenses.': t(
            'financeDashboard.modules.descriptions.chartOfAccounts',
            'Foundation for assets, liabilities, equity, revenue, COGS, and expenses.',
        ),
        'Manage account structure for assets, liabilities, equity, revenue, COGS, and expenses.': t(
            'financeDashboard.modules.descriptions.chartOfAccounts',
            'Manage account structure for assets, liabilities, equity, revenue, COGS, and expenses.',
        ),
        'Journal headers and lines for every approved financial event.': t(
            'financeDashboard.modules.descriptions.generalLedger',
            'Journal headers and lines for every approved financial event.',
        ),
        'Review entries generated from completed orders, approved expenses, and manual journals.': t(
            'financeDashboard.modules.descriptions.generalLedger',
            'Review entries generated from completed orders, approved expenses, and manual journals.',
        ),
        'Operational expenses with approval and account mapping support.': t(
            'financeDashboard.modules.descriptions.expenses',
            'Operational expenses with approval and account mapping support.',
        ),
        'Track business expenses with approval status and accounting impact.': t(
            'financeDashboard.modules.descriptions.expenses',
            'Track business expenses with approval status and accounting impact.',
        ),
        'Payroll runs, payroll items, and unpaid salary visibility.': t(
            'financeDashboard.modules.descriptions.payroll',
            'Payroll runs, payroll items, and unpaid salary visibility.',
        ),
        'Process monthly payroll, contract payouts, and salary-linked deductions.': t(
            'financeDashboard.modules.descriptions.payroll',
            'Process monthly payroll, contract payouts, and salary-linked deductions.',
        ),
        'Employee takeouts and automatic payroll deductions.': t(
            'financeDashboard.modules.descriptions.employeeAdvances',
            'Employee takeouts and automatic payroll deductions.',
        ),
        'Record employee advances and keep payroll deductions aligned with settlement.': t(
            'financeDashboard.modules.descriptions.employeeAdvances',
            'Record employee advances and keep payroll deductions aligned with settlement.',
        ),
        'Manual cash movements, deposits, withdrawals, and branch petty cash.': t(
            'financeDashboard.modules.descriptions.cashBank',
            'Manual cash movements, deposits, withdrawals, and branch petty cash.',
        ),
        'Monitor drawers, deposits, owner funding, and manual inflow or outflow entries.': t(
            'financeDashboard.modules.descriptions.cashBank',
            'Monitor drawers, deposits, owner funding, and manual inflow or outflow entries.',
        ),
        'Weighted average costing and inventory-to-COGS movement tracking.': t(
            'financeDashboard.modules.descriptions.inventoryValuation',
            'Weighted average costing and inventory-to-COGS movement tracking.',
        ),
        'Follow weighted average costing, stock value, and cost of goods sold readiness.': t(
            'financeDashboard.modules.descriptions.inventoryValuation',
            'Follow weighted average costing, stock value, and cost of goods sold readiness.',
        ),
    };

    return descriptionMap[description] ?? description;
}

function localizeModuleStatus(
    status: string,
    t: (key: string, fallback?: string) => string,
) {
    const statusMap: Record<string, string> = {
        Ready: t('financeDashboard.modules.status.ready', 'Ready'),
        'Needs upgrade': t(
            'financeDashboard.modules.status.needsUpgrade',
            'Needs upgrade',
        ),
        'Pending migration': t(
            'financeDashboard.modules.status.pendingMigration',
            'Pending migration',
        ),
    };

    return statusMap[status] ?? status;
}

function localizeModuleStatLabel(
    label: string,
    t: (key: string, fallback?: string) => string,
) {
    const labelMap: Record<string, string> = {
        Accounts: t('financeDashboard.modules.stats.accounts', 'Accounts'),
        Journals: t('financeDashboard.modules.stats.journals', 'Journals'),
        Drafts: t('financeDashboard.modules.stats.drafts', 'Drafts'),
        Employees: t('financeDashboard.modules.stats.employees', 'Employees'),
        Advances: t('financeDashboard.modules.stats.advances', 'Advances'),
        Draft: t('financeDashboard.modules.stats.draft', 'Draft'),
        Submitted: t(
            'financeDashboard.modules.stats.submitted',
            'Submitted',
        ),
        Active: t('financeDashboard.modules.stats.active', 'Active'),
        Balance: t('financeDashboard.modules.stats.balance', 'Balance'),
        SKUs: t('financeDashboard.modules.stats.skus', 'SKUs'),
        Value: t('financeDashboard.modules.stats.value', 'Value'),
    };

    return labelMap[label] ?? label;
}

function localizeCoverageLabel(
    label: string,
    t: (key: string, fallback?: string) => string,
) {
    const labelMap: Record<string, string> = {
        Sales: t('financeDashboard.summary.sales', 'Sales'),
        'Employee Covered': t(
            'financeDashboard.summary.employeeCovered',
            'Employee Covered',
        ),
        'Restaurant Hospitality': t(
            'financeDashboard.summary.restaurantHospitality',
            'Restaurant Hospitality',
        ),
    };

    return labelMap[label] ?? label;
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

function moduleHref(name: string): string | null {
    if (name === 'Chart of Accounts') {
        return '/finance/chart-of-accounts';
    }

    if (name === 'General Ledger') {
        return '/finance/general-ledger';
    }

    if (name === 'Inventory Valuation') {
        return '/finance/inventory-valuation';
    }

    if (name === 'Payroll') {
        return '/finance/payroll';
    }

    if (name === 'Employee Advances') {
        return '/finance/employee-advances';
    }

    if (name === 'Expenses') {
        return '/finance/expenses';
    }

    if (name === 'Cash & Bank') {
        return '/finance/cash-bank';
    }

    return null;
}

function formatModuleStat(value: number, format: 'currency' | 'number') {
    return format === 'currency' ? formatAfn(value) : formatNumber(value);
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

function coverageChartColor(tone: string) {
    if (tone === 'employee') {
        return '#2563eb';
    }

    if (tone === 'house') {
        return '#d97706';
    }

    return '#14532d';
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
    projectionHealth,
    dashboard,
}: FinancePageProps) {
    const { auth } = usePage<SharedData>().props;
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] =
        auth.is_super_admin || !auth.roles.includes('finance')
            ? [
                  {
                      title: t('common.dashboard', 'Dashboard'),
                      href: '/dashboard',
                  },
                  {
                      title: t('navigation.finance', 'Finance'),
                      href: '/finance',
                  },
              ]
            : [
                  {
                      title: t('navigation.finance', 'Finance'),
                      href: '/finance',
                  },
              ];
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
    const rangeOptions = RANGE_VALUES.map((value) => ({
        value,
        label: t(
            `financeDashboard.filters.range.${value}`,
            value.replace('_', ' '),
        ),
    }));
    const paymentMethods = PAYMENT_METHOD_VALUES.map((value) => ({
        value,
        label: t(`orders.paymentMethod.${value}`, value.replace('_', ' ')),
    }));
    const coverageComparison = dashboard.coverageComparison.map((entry) => ({
        ...entry,
        label: localizeCoverageLabel(entry.label, t),
    }));

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
            <Head title={t('financeDashboard.pageTitle', 'Finance Dashboard')} />

            <div className="space-y-6 py-2">
                <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] p-6 shadow-none dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_45%,#0b2a1f_100%)]">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300/70 bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.24em] text-neutral-600 uppercase dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
                                <ChartNoAxesCombined className="h-3.5 w-3.5" />
                                {t(
                                    'financeDashboard.eyebrow',
                                    'Finance Dashboard',
                                )}
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                    {t(
                                        'financeDashboard.hero.title',
                                        'Financial control center for revenue, payroll, expenses, inventory, and cash.',
                                    )}
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                    {t(
                                        'financeDashboard.hero.description',
                                        'This is the finance dashboard which is designed around the accounting foundation: chart of accounts, ledger postings, payroll, advances, cash movements, and inventory valuation.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:min-w-[420px]">
                            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                                <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                    {t(
                                        'financeDashboard.hero.ledgerAccounts',
                                        'Ledger Accounts',
                                    )}
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(
                                        dashboard.ledgerStats.accounts,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                                <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                    {t(
                                        'financeDashboard.hero.approvalQueue',
                                        'Approval Queue',
                                    )}
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(
                                        dashboard.ledgerStats.approval_queue,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {auth.is_super_admin ? (
                        <div
                            className={`mt-6 rounded-2xl border px-4 py-3 ${projectionTone(projectionHealth.status)}`}
                        >
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-xs font-medium tracking-[0.22em] uppercase">
                                        {t(
                                            'financeDashboard.projection.title',
                                            'Projection Health',
                                        )}
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {projectionHealth.usesProjectionData
                                            ? localizeProjectionMessage(
                                                  projectionHealth.message,
                                                  t,
                                              )
                                            : t(
                                                  'financeDashboard.projection.transactionalFallback',
                                                  'This filtered view is using transactional reads because the selected filters are more specific than the current projection granularity.',
                                              )}
                                    </p>
                                </div>
                                <div className="text-sm">
                                    {projectionHealth.latestProjectionAt
                                        ? t(
                                              'financeDashboard.projection.lastProjectedAt',
                                              'Last projected at :date',
                                          ).replace(
                                              ':date',
                                              new Date(
                                                  projectionHealth.latestProjectionAt,
                                              ).toLocaleString(),
                                          )
                                        : t(
                                              'financeDashboard.projection.noTimestamp',
                                              'No projection timestamp recorded yet',
                                          )}
                                </div>
                            </div>
                            {projectionHealth.branches.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {projectionHealth.branches.map((branch) => (
                                        <div
                                            key={branch.branchId}
                                            className="rounded-full border border-current/20 px-3 py-1"
                                        >
                                            {branch.branchName}:{' '}
                                            {localizeProjectionMessage(
                                                branch.message,
                                                t,
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </section>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="space-y-2">
                        <CardTitle>
                            {t('financeDashboard.filters.title', 'Filters')}
                        </CardTitle>
                        <CardDescription>
                            {t(
                                'financeDashboard.filters.description',
                                'Slice the finance dashboard by period, branch, payment method, and expense category.',
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
                                    {t(
                                        'financeDashboard.filters.branch',
                                        'Branch',
                                    )}
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
                                        <SelectValue
                                            placeholder={t(
                                                'financeDashboard.filters.allBranches',
                                                'All branches',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">
                                            {t(
                                                'financeDashboard.filters.allBranches',
                                                'All branches',
                                            )}
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
                                    {t(
                                        'financeDashboard.filters.paymentMethod',
                                        'Payment Method',
                                    )}
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
                                        <SelectValue
                                            placeholder={t(
                                                'financeDashboard.filters.allMethods',
                                                'All methods',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">
                                            {t(
                                                'financeDashboard.filters.allMethods',
                                                'All methods',
                                            )}
                                        </SelectItem>
                                        {paymentMethods.map((method) => (
                                            <SelectItem
                                                key={method.value}
                                                value={method.value}
                                            >
                                                {method.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                    {t(
                                        'financeDashboard.filters.expenseCategory',
                                        'Expense Category',
                                    )}
                                </p>
                                <SearchableDropdown
                                    value={category}
                                    options={[
                                        {
                                            value: '',
                                            label: t(
                                                'financeDashboard.filters.allCategories',
                                                'All categories',
                                            ),
                                        },
                                        ...expenseCategories,
                                    ]}
                                    onValueChange={setCategory}
                                    placeholder={t(
                                        'financeDashboard.filters.allCategories',
                                        'All categories',
                                    )}
                                    searchPlaceholder={t(
                                        'financeDashboard.filters.searchExpenseCategory',
                                        'Search expense category...',
                                    )}
                                    emptyText={t(
                                        'financeDashboard.filters.noExpenseCategoryFound',
                                        'No expense category found.',
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                    {t(
                                        'financeDashboard.filters.startDate',
                                        'Start Date',
                                    )}
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
                                    {t(
                                        'financeDashboard.filters.endDate',
                                        'End Date',
                                    )}
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
                                {t(
                                    'financeDashboard.filters.apply',
                                    'Apply Filters',
                                )}
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
                                {t('common.reset', 'Reset')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title={t('financeDashboard.summary.sales', 'Sales')}
                        value={formatAfn(dashboard.summary.sales)}
                        subtitle={t(
                            'financeDashboard.summary.salesSubtitle',
                            'Completed order revenue in selected period',
                        )}
                        icon={<Banknote className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.expenses',
                            'Expenses',
                        )}
                        value={formatAfn(dashboard.summary.expenses)}
                        subtitle={t(
                            'financeDashboard.summary.expensesSubtitle',
                            'Recorded operational expenses',
                        )}
                        icon={<ReceiptText className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.grossProfit',
                            'Gross Profit',
                        )}
                        value={
                            dashboard.summary.grossProfit === null
                                ? t(
                                      'financeDashboard.summary.pending',
                                      'Pending',
                                  )
                                : formatAfn(dashboard.summary.grossProfit)
                        }
                        subtitle={localizeFinanceNote(
                            dashboard.notes.grossProfit,
                            t,
                        )}
                        icon={<ArrowUpRight className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.netProfit',
                            'Net Profit',
                        )}
                        value={formatAfn(dashboard.summary.netProfit)}
                        subtitle={t(
                            'financeDashboard.summary.netProfitSubtitle',
                            'Sales minus expenses, before unposted finance adjustments',
                        )}
                        icon={<ArrowDownRight className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.cashPosition',
                            'Cash Position',
                        )}
                        value={formatAfn(dashboard.summary.cashPosition)}
                        subtitle={localizeFinanceNote(
                            dashboard.notes.cashPosition,
                            t,
                        )}
                        icon={<Wallet className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.employeeCovered',
                            'Employee Covered',
                        )}
                        value={formatAfn(dashboard.summary.employeeCoveredTotal)}
                        subtitle={t(
                            'financeDashboard.summary.employeeCoveredSubtitle',
                            'Orders paid by employees on behalf of guests',
                        )}
                        icon={<Users className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.restaurantHospitality',
                            'Restaurant Hospitality',
                        )}
                        value={formatAfn(dashboard.summary.houseCompTotal)}
                        subtitle={t(
                            'financeDashboard.summary.restaurantHospitalitySubtitle',
                            'Hospitality and complimentary orders excluded from sales',
                        )}
                        icon={<Coins className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.unpaidSalaries',
                            'Unpaid Salaries',
                        )}
                        value={formatAfn(dashboard.summary.unpaidSalaries)}
                        subtitle={t(
                            'financeDashboard.summary.unpaidSalariesSubtitle',
                            'Current month salary and scheduled contract liabilities',
                        )}
                        icon={<Users className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.inventoryValue',
                            'Inventory Value',
                        )}
                        value={formatAfn(dashboard.summary.inventoryValue)}
                        subtitle={t(
                            'financeDashboard.summary.inventoryValueSubtitle',
                            'Current stock value from quantity and unit cost',
                        )}
                        icon={<Package className="h-5 w-5" />}
                    />
                    <SummaryCard
                        title={t(
                            'financeDashboard.summary.supplierBalances',
                            'Supplier Balances',
                        )}
                        value={formatAfn(dashboard.summary.supplierBalances)}
                        subtitle={t(
                            'financeDashboard.summary.supplierBalancesSubtitle',
                            'Unpaid vendor balance from stock purchases',
                        )}
                        icon={<CreditCard className="h-5 w-5" />}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'financeDashboard.charts.revenueExpenseTitle',
                                    'Revenue, Expense, and Operating Result',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeDashboard.charts.revenueExpenseDescription',
                                    'Daily trend for the selected finance window.',
                                )}
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
                            <CardTitle>
                                {t(
                                    'financeDashboard.charts.coverageTitle',
                                    'Sales vs Covered Orders',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeDashboard.charts.coverageDescription',
                                    'Compare recognized sales with employee-covered and restaurant hospitality volume for the selected period.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={coverageComparison}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => formatNumber(Number(value))}
                                        />
                                        <Tooltip formatter={(value: number) => formatAfn(value)} />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                            {coverageComparison.map((entry) => (
                                                <Cell
                                                    key={entry.label}
                                                    fill={coverageChartColor(entry.tone)}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'financeDashboard.charts.branchRevenueTitle',
                                    'Branch-wise Revenue',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeDashboard.charts.branchRevenueDescription',
                                    'Compare completed order revenue by branch.',
                                )}
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
                            <CardTitle>
                                {t(
                                    'financeDashboard.charts.expenseCategoriesTitle',
                                    'Top Expense Categories',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeDashboard.charts.expenseCategoriesDescription',
                                    'Expense concentration in the selected period.',
                                )}
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
                                        {t(
                                            'financeDashboard.charts.noExpenseCategories',
                                            'No expense categories were found for the selected filters.',
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'financeDashboard.ledger.title',
                                    'Ledger Readiness',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeDashboard.ledger.description',
                                    'Live accounting activity from posted operations and pending finance records.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        {t(
                                            'financeDashboard.ledger.accounts',
                                            'Accounts',
                                        )}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats.accounts,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        {t(
                                            'financeDashboard.ledger.postedEntries',
                                            'Posted Entries',
                                        )}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats.journals,
                                        )}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        {t(
                                            'financeDashboard.ledger.postedEntriesDescription',
                                            'Approved expenses, approved cash movements, completed sales, and posted journals',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        {t(
                                            'financeDashboard.ledger.draftEntries',
                                            'Draft Entries',
                                        )}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats
                                                .draft_journals,
                                        )}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        {t(
                                            'financeDashboard.ledger.draftEntriesDescription',
                                            'Draft expenses, draft cash movements, and unposted journal drafts',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                                    <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">
                                        {t(
                                            'financeDashboard.ledger.approvalQueue',
                                            'Approval Queue',
                                        )}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatNumber(
                                            dashboard.ledgerStats
                                                .approval_queue,
                                        )}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        {t(
                                            'financeDashboard.ledger.approvalQueueDescription',
                                            'Submitted records waiting for manager approval',
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                                {t(
                                    'financeDashboard.ledger.note',
                                    'These numbers now reflect real operational finance activity. When automatic journal posting is fully enabled, this same area will transition from operational entries to strict accounting journals without changing the workflow for your team.',
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'financeDashboard.modules.title',
                                    'Finance Modules',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financeDashboard.modules.description',
                                    'Open finance areas from here so the dashboard filters stay focused on analytics.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            {dashboard.modules.map((module) => (
                                <div
                                    key={module.name}
                                    className="flex min-h-[172px] flex-col rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-2">
                                            <p className="font-medium text-neutral-950 dark:text-neutral-50">
                                                {localizeModuleName(
                                                    module.name,
                                                    t,
                                                )}
                                            </p>
                                            <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                                                {localizeModuleDescription(
                                                    module.description,
                                                    t,
                                                )}
                                            </p>
                                        </div>
                                        {module.status === 'Ready' ? (
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                                                <Check className="h-4 w-4" />
                                            </span>
                                        ) : (
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(module.status)}`}
                                            >
                                                {localizeModuleStatus(
                                                    module.status,
                                                    t,
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {module.name !== 'Employee Advances' &&
                                    module.stats &&
                                    module.stats.length > 0 ? (
                                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                            {module.stats.map((stat) => (
                                                <div
                                                    key={`${module.name}-${stat.label}`}
                                                    className="rounded-2xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/80"
                                                >
                                                    <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">
                                                        {localizeModuleStatLabel(
                                                            stat.label,
                                                            t,
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                                                        {formatModuleStat(
                                                            stat.value,
                                                            stat.format,
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                    {moduleHref(module.name) ? (
                                        <div className="mt-auto flex justify-end pt-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={
                                                        moduleHref(
                                                            module.name,
                                                        ) as string
                                                    }
                                                    className="gap-2 text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-50"
                                                >
                                                    {t('common.open', 'Open')}
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </span>
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle>
                                    {t(
                                        'financeDashboard.generalLedger.title',
                                        'General Ledger Preview',
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'financeDashboard.generalLedger.description',
                                        'A recent snapshot of financial entries. Open the full ledger from Finance Modules.',
                                    )}
                                </CardDescription>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/finance/general-ledger">
                                    {t(
                                        'financeDashboard.generalLedger.open',
                                        'Open General Ledger',
                                    )}
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {dashboard.generalLedgerPreview.length > 0 ? (
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
                                                    'financeDashboard.generalLedger.columns.branch',
                                                    'Branch',
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
                                        {dashboard.generalLedgerPreview.map(
                                            (entry) => (
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
                                                        {entry.branch}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        {entry.account}
                                                    </td>
                                                    <td className="px-3 py-3 text-neutral-600 dark:text-neutral-300">
                                                        {entry.description}
                                                    </td>
                                                    <td className="px-3 py-3 text-right whitespace-nowrap">
                                                        {entry.debit > 0
                                                            ? formatAfn(
                                                                  entry.debit,
                                                              )
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
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${ledgerStatusTone(
                                                                entry.status,
                                                            )}`}
                                                        >
                                                            {localizeLedgerStatus(
                                                                entry.status,
                                                                t,
                                                            )}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                {t(
                                    'financeDashboard.generalLedger.empty',
                                    'No recent ledger entries were found for the selected filters.',
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <BookOpenText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {t(
                                        'financeDashboard.quickCards.chartOfAccounts.title',
                                        'Chart of Accounts',
                                    )}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {t(
                                        'financeDashboard.quickCards.chartOfAccounts.description',
                                        'Assets, liabilities, equity, revenue, COGS, and expenses',
                                    )}
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
                                    {t(
                                        'financeDashboard.quickCards.branchControl.title',
                                        'Branch-wise Control',
                                    )}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {t(
                                        'financeDashboard.quickCards.branchControl.description',
                                        'Consolidated reporting with branch-level filters and balances',
                                    )}
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
                                    {t(
                                        'financeDashboard.quickCards.cashBank.title',
                                        'Cash & Bank',
                                    )}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {t(
                                        'financeDashboard.quickCards.cashBank.description',
                                        'Cash drawers, deposits, petty cash, and manual movements',
                                    )}
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
                                    {t(
                                        'financeDashboard.quickCards.inventoryValuation.title',
                                        'Inventory Valuation',
                                    )}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {t(
                                        'financeDashboard.quickCards.inventoryValuation.description',
                                        'Weighted average costing for stock value and COGS',
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
