import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    Banknote,
    Boxes,
    PackageCheck,
    WalletCards,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

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

function MetricCard({
    title,
    value,
    note,
    icon: Icon,
}: {
    title: string;
    value: string;
    note: string;
    icon: typeof Boxes;
}) {
    return (
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm shadow-neutral-950/5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {value}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{note}</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ data }: { data: DashboardData }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="min-h-full bg-neutral-50/70 p-4 sm:p-6 dark:bg-neutral-950">
                <section className="overflow-hidden rounded-3xl border border-neutral-200/70 bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950 p-6 text-white shadow-xl shadow-neutral-950/10 sm:p-8 dark:border-neutral-800">
                    <p className="text-sm font-medium text-amber-300">
                        Paktia Market ERP
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Operational overview
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-neutral-300">
                        Inventory, finance, payroll, and branch activity in one
                        focused workspace.
                    </p>
                </section>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {data.inventory && (
                        <>
                            <MetricCard
                                title="Inventory items"
                                value={formatNumber(data.inventory.totalItems)}
                                note="Items tracked across branches"
                                icon={Boxes}
                            />
                            <MetricCard
                                title="Inventory value"
                                value={`${formatPrice(data.inventory.inventoryValue)} ؋`}
                                note="Current stock valuation"
                                icon={PackageCheck}
                            />
                        </>
                    )}
                    {data.finance && (
                        <>
                            <MetricCard
                                title="Cash position"
                                value={`${formatPrice(data.finance.cashPosition)} ؋`}
                                note="Approved cash movements"
                                icon={WalletCards}
                            />
                            <MetricCard
                                title="Approved expenses"
                                value={`${formatPrice(data.finance.expenses)} ؋`}
                                note="Recorded finance expenses"
                                icon={Banknote}
                            />
                        </>
                    )}
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    {data.inventory && (
                        <section className="rounded-2xl border border-neutral-200/70 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        Stock attention
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Low and unavailable inventory
                                    </p>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">
                                        {data.inventory.lowStockItems} low
                                    </span>
                                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-red-700 dark:text-red-300">
                                        {data.inventory.outOfStockItems} out
                                    </span>
                                </div>
                            </div>
                            <div className="mt-5 space-y-2">
                                {data.inventory.lowStockQuickList.map(
                                    (item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-950/70"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.branch}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {formatNumber(item.quantity)}{' '}
                                                {item.unit}
                                            </span>
                                        </div>
                                    ),
                                )}
                                {data.inventory.lowStockQuickList.length ===
                                    0 && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        Inventory levels look healthy.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {data.finance && (
                        <section className="rounded-2xl border border-neutral-200/70 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        Finance attention
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Recent expenses and pending obligations
                                    </p>
                                </div>
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950/70">
                                    <p className="text-xs text-muted-foreground">
                                        Unpaid payroll
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        {formatPrice(
                                            data.finance.unpaidPayroll,
                                        )}{' '}
                                        ؋
                                    </p>
                                </div>
                                <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950/70">
                                    <p className="text-xs text-muted-foreground">
                                        Pending expenses
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        {formatNumber(
                                            data.finance.pendingExpenses,
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                {data.finance.recentExpenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className="flex items-center justify-between rounded-xl border border-neutral-200/70 px-4 py-3 dark:border-neutral-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {expense.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {expense.branch} ·{' '}
                                                    {expense.date}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {formatPrice(expense.amount)} ؋
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
