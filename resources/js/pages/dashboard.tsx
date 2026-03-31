import { BarChartDefault } from '@/components/charts/bar-chart-default';
import { OrderAnalyticsChart } from '@/components/charts/order-analytics-chart';
import { PieChartDonutText } from '@/components/charts/pie-chart-donut';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Order } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarIcon,
    Dot,
    Flame,
    ShieldAlert,
} from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function formatDate(date: Date | undefined) {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

function toDateParam(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatOrderStatus(status?: string) {
    if (!status) {
        return 'Pending';
    }

    return status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getOrderStatusBadgeClass(status?: string) {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
        case 'in_progress':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
        case 'ready':
            return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200';
        case 'cancelled':
            return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200';
        case 'pending':
        default:
            return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200';
    }
}

function projectionBadgeClass(status?: string) {
    switch (status) {
        case 'healthy':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
        case 'warning':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
        case 'critical':
            return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200';
    }
}

function attentionBadgeClass(level: 'critical' | 'warning' | 'info') {
    switch (level) {
        case 'critical':
            return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200';
        case 'warning':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200';
    }
}

interface DashboardProps {
    data?: {
        orders: {
            pending: number;
            in_progress: number;
            ready: number;
            completed: number;
            cancelled: number;
        } | null;
        orderAnalytics: Array<{
            date: string;
            day: string;
            pending: number;
            preparing: number;
            ready: number;
            completed: number;
            cancelled: number;
        }>;
        recentOrders: Order[];
        topOrderedDishes: Array<{
            product_name: string;
            category_name: string;
            total_quantity: number;
        }>;
        selectedDate: string;
        inventory: {
            totalItems: number;
            totalFixedItems: number;
            totalUsableItems: number;
            lowStockItems: number;
            outOfStockItems: number;
            inventoryValue: number;
            amountOwedToVendors: number;
            pie: Array<{
                key: 'usable' | 'fixed' | 'other';
                label: string;
                value: number;
            }>;
            lowStockQuickList: Array<{
                id: number;
                name: string;
                quantity: number;
                unit: string | null;
                branch: string;
                status: 'low' | 'out';
            }>;
        } | null;
        finance: {
            netProfit: number;
            expenses: number;
            cashPosition: number;
            projectionHealth?: {
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
                    latestProjectionAt?: string | null;
                }>;
            };
            monthlyNetProfit: Array<{
                month: string;
                label: string;
                netProfit: number;
            }>;
            branchPerformance: Array<{
                branchId: number;
                branchName: string;
                revenue: number;
                completedOrders: number;
                netProfit: number;
            }>;
            notes: {
                netProfit: string;
                expenses: string;
                cashPosition: string;
            };
        } | null;
        attentionItems: Array<{
            title: string;
            detail: string;
            level: 'critical' | 'warning' | 'info';
        }>;
    };
}

function DashboardSurface({
    title,
    description,
    children,
    className,
    headerAction,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}) {
    return (
        <Card
            className={cn(
                'rounded-2xl border border-neutral-200/70 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-neutral-200/60 pb-4 dark:border-neutral-800/80">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                        {title}
                    </CardTitle>
                    {description ? (
                        <CardDescription className="text-sm">
                            {description}
                        </CardDescription>
                    ) : null}
                </div>
                {headerAction}
            </CardHeader>
            <CardContent className="pt-5">{children}</CardContent>
        </Card>
    );
}

function MetricInline({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-3.5">
            <div className="space-y-1.5">
                <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    {label}
                </p>
                {hint ? (
                    <p className="max-w-[28ch] text-xs leading-5 text-muted-foreground">
                        {hint}
                    </p>
                ) : null}
            </div>
            <div className="shrink-0 text-right text-[1.85rem] leading-none font-semibold tracking-[-0.03em] text-foreground tabular-nums">
                {value}
            </div>
        </div>
    );
}

function StatusPill({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border border-neutral-200/70 bg-neutral-50/80 px-3.5 py-3 dark:border-neutral-800 dark:bg-neutral-950/40',
                className,
            )}
        >
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-2 text-2xl leading-none font-semibold tracking-[-0.03em] text-foreground tabular-nums">
                {value}
            </p>
        </div>
    );
}

export default function Dashboard({ data }: DashboardProps) {
    const selectedDateFromProps = React.useMemo(() => {
        if (!data?.selectedDate) {
            return new Date();
        }

        const parsed = new Date(`${data.selectedDate}T00:00:00`);

        return isValidDate(parsed) ? parsed : new Date();
    }, [data?.selectedDate]);
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(
        selectedDateFromProps,
    );
    const [month, setMonth] = React.useState<Date | undefined>(
        selectedDateFromProps,
    );
    const [value, setValue] = React.useState(formatDate(selectedDateFromProps));
    const ordersStats = data?.orders;
    const formattedSelectedDate = React.useMemo(() => {
        if (!data?.selectedDate) {
            return 'today';
        }

        return new Date(`${data.selectedDate}T00:00:00`).toLocaleDateString(
            'en-US',
            {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            },
        );
    }, [data?.selectedDate]);

    const orderAnalyticsData = data?.orderAnalytics ?? [];
    const recentOrders = data?.recentOrders ?? [];
    const topOrderedDishes = data?.topOrderedDishes ?? [];
    const inventoryStats = data?.inventory;
    const financeStats = data?.finance;
    const attentionItems = data?.attentionItems ?? [];
    const financeMiniTrend = React.useMemo(
        () => (financeStats?.monthlyNetProfit ?? []).slice(-4),
        [financeStats?.monthlyNetProfit],
    );
    const canViewOrders = ordersStats !== null && ordersStats !== undefined;
    const canViewInventory =
        inventoryStats !== null && inventoryStats !== undefined;
    const canViewFinance = financeStats !== null && financeStats !== undefined;
    const hasAnySection = canViewOrders || canViewInventory || canViewFinance;
    const orderMetricTiles = [
        {
            label: 'Pending',
            value: ordersStats?.pending ?? 0,
        },
        {
            label: 'Preparing',
            value: ordersStats?.in_progress ?? 0,
        },
        {
            label: 'Ready',
            value: ordersStats?.ready ?? 0,
        },
        {
            label: 'Completed',
            value: ordersStats?.completed ?? 0,
        },
        {
            label: 'Cancelled',
            value: ordersStats?.cancelled ?? 0,
        },
    ];

    React.useEffect(() => {
        setDate(selectedDateFromProps);
        setMonth(selectedDateFromProps);
        setValue(formatDate(selectedDateFromProps));
    }, [selectedDateFromProps]);

    const applyDateFilter = React.useCallback((selected: Date | undefined) => {
        if (!selected || !isValidDate(selected)) {
            return;
        }

        router.get(
            dashboard().url,
            { date: toDateParam(selected) },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full w-full flex-1 flex-col gap-3 py-2">
                {hasAnySection ? (
                    <>
                        {financeStats?.projectionHealth ? (
                            <Card className="rounded-2xl border border-neutral-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbfb_72%,rgba(16,47,51,0.08)_100%)] shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                                <CardContent className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${projectionBadgeClass(
                                                    financeStats
                                                        .projectionHealth
                                                        .status,
                                                )}`}
                                            >
                                                Projection{' '}
                                                {
                                                    financeStats
                                                        .projectionHealth.status
                                                }
                                            </span>
                                            <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase dark:text-neutral-400">
                                                System health check
                                            </span>
                                        </div>
                                        <p className="text-sm leading-6 text-foreground dark:text-neutral-200">
                                            {
                                                financeStats.projectionHealth
                                                    .message
                                            }
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 sm:min-w-[18rem]">
                                        <StatusPill
                                            label="Healthy"
                                            value={formatNumber(
                                                Math.max(
                                                    0,
                                                    financeStats
                                                        .projectionHealth
                                                        .branches.length -
                                                        financeStats
                                                            .projectionHealth
                                                            .warningBranchCount -
                                                        financeStats
                                                            .projectionHealth
                                                            .criticalBranchCount,
                                                ),
                                            )}
                                            className="dark:border-neutral-800 dark:bg-neutral-950/40"
                                        />
                                        <StatusPill
                                            label="Warning"
                                            value={formatNumber(
                                                financeStats.projectionHealth
                                                    .warningBranchCount,
                                            )}
                                            className="dark:border-neutral-800 dark:bg-neutral-950/40"
                                        />
                                        <StatusPill
                                            label="Critical"
                                            value={formatNumber(
                                                financeStats.projectionHealth
                                                    .criticalBranchCount,
                                            )}
                                            className="dark:border-neutral-800 dark:bg-neutral-950/40"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                            {canViewFinance ? (
                                <DashboardSurface
                                    title="Finance Snapshot"
                                    description="A clean read of profitability and cash health."
                                    className="xl:col-span-3"
                                >
                                    <div className="divide-y divide-neutral-200/70 dark:divide-neutral-800/80">
                                        <MetricInline
                                            label="Net Profit"
                                            value={`${formatPrice(
                                                financeStats?.netProfit ?? 0,
                                            )} ؋`}
                                            hint={financeStats?.notes.netProfit}
                                        />
                                        <MetricInline
                                            label="Expenses"
                                            value={`${formatPrice(
                                                financeStats?.expenses ?? 0,
                                            )} ؋`}
                                            hint={financeStats?.notes.expenses}
                                        />
                                        <MetricInline
                                            label="Cash Position"
                                            value={`${formatPrice(
                                                financeStats?.cashPosition ?? 0,
                                            )} ؋`}
                                            hint={
                                                financeStats?.notes.cashPosition
                                            }
                                        />
                                    </div>
                                    <div className="mt-4 rounded-2xl bg-neutral-50/70 px-4 py-4 dark:bg-neutral-950/40">
                                        <BarChartDefault
                                            data={financeMiniTrend}
                                            title="Net Profit Trend"
                                            description="Past 4 months"
                                            footerNote="Compact monthly net profit view"
                                            compact
                                        />
                                    </div>
                                </DashboardSurface>
                            ) : null}

                            {canViewOrders ? (
                                <DashboardSurface
                                    title="Order Flow"
                                    description={`Operational view for ${formattedSelectedDate}.`}
                                    className="xl:col-span-6"
                                    headerAction={
                                        <Field className="w-44">
                                            <InputGroup>
                                                <InputGroupInput
                                                    id="date-required"
                                                    value={value}
                                                    readOnly
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key ===
                                                            'ArrowDown'
                                                        ) {
                                                            e.preventDefault();
                                                            setOpen(true);
                                                        }
                                                    }}
                                                />
                                                <InputGroupAddon align="inline-end">
                                                    <Popover
                                                        open={open}
                                                        onOpenChange={setOpen}
                                                    >
                                                        <PopoverTrigger asChild>
                                                            <InputGroupButton
                                                                id="date-picker"
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                aria-label="Select date"
                                                            >
                                                                <CalendarIcon />
                                                                <span className="sr-only">
                                                                    Select date
                                                                </span>
                                                            </InputGroupButton>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto overflow-hidden p-0"
                                                            align="end"
                                                            alignOffset={-8}
                                                            sideOffset={10}
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={date}
                                                                month={month}
                                                                onMonthChange={
                                                                    setMonth
                                                                }
                                                                onSelect={(
                                                                    date,
                                                                ) => {
                                                                    if (!date) {
                                                                        return;
                                                                    }

                                                                    setDate(
                                                                        date,
                                                                    );
                                                                    setValue(
                                                                        formatDate(
                                                                            date,
                                                                        ),
                                                                    );
                                                                    setOpen(
                                                                        false,
                                                                    );
                                                                    applyDateFilter(
                                                                        date,
                                                                    );
                                                                }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </InputGroupAddon>
                                            </InputGroup>
                                        </Field>
                                    }
                                >
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
                                            {orderMetricTiles.map((item) => (
                                                <StatusPill
                                                    key={item.label}
                                                    label={item.label}
                                                    value={formatNumber(
                                                        item.value,
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <div className="rounded-2xl bg-neutral-50/70 px-4 py-4 dark:bg-neutral-950/40">
                                            <OrderAnalyticsChart
                                                data={orderAnalyticsData}
                                                title="Order movement"
                                                description="Past 7 days across pending, kitchen, and completion stages"
                                            />
                                        </div>
                                    </div>
                                </DashboardSurface>
                            ) : null}

                            {canViewInventory ? (
                                <DashboardSurface
                                    title="Inventory Health"
                                    description="Inventory strength, exposure, and stock pressure."
                                    className="xl:col-span-3"
                                >
                                    <div className="space-y-4">
                                        <div className="rounded-2xl bg-neutral-50/70 px-4 py-4 dark:bg-neutral-950/40">
                                            <PieChartDonutText
                                                total={
                                                    inventoryStats?.totalItems ??
                                                    0
                                                }
                                                totalFixedItems={
                                                    inventoryStats?.totalFixedItems ??
                                                    0
                                                }
                                                totalUsableItems={
                                                    inventoryStats?.totalUsableItems ??
                                                    0
                                                }
                                                lowStockItems={
                                                    inventoryStats?.lowStockItems ??
                                                    0
                                                }
                                                outOfStockItems={
                                                    inventoryStats?.outOfStockItems ??
                                                    0
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <StatusPill
                                                label="Total Items"
                                                value={formatNumber(
                                                    inventoryStats?.totalItems ??
                                                        0,
                                                )}
                                            />
                                            <StatusPill
                                                label="Inventory Value"
                                                value={`${formatPrice(
                                                    inventoryStats?.inventoryValue ??
                                                        0,
                                                )} ؋`}
                                            />
                                            <StatusPill
                                                label="Usable"
                                                value={formatNumber(
                                                    inventoryStats?.totalUsableItems ??
                                                        0,
                                                )}
                                            />
                                            <StatusPill
                                                label="Fixed"
                                                value={formatNumber(
                                                    inventoryStats?.totalFixedItems ??
                                                        0,
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-amber-200/70 bg-amber-50/90 p-3 dark:border-amber-900/70 dark:bg-amber-950/30">
                                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                                    <Flame className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        Low stock
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                                    {formatNumber(
                                                        inventoryStats?.lowStockItems ??
                                                            0,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-red-200/70 bg-red-50/90 p-3 dark:border-red-900/70 dark:bg-red-950/30">
                                                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                                    <ShieldAlert className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        Out of stock
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                                    {formatNumber(
                                                        inventoryStats?.outOfStockItems ??
                                                            0,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </DashboardSurface>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                            <DashboardSurface
                                title="Needs Attention"
                                description="Operational signals that need a closer look."
                                className="xl:col-span-4"
                            >
                                <div className="space-y-3">
                                    {attentionItems.length > 0 ? (
                                        attentionItems.map((item, index) => (
                                            <div
                                                key={`${item.title}-${index}`}
                                                className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-950/40"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs leading-5 text-muted-foreground">
                                                            {item.detail}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${attentionBadgeClass(
                                                            item.level,
                                                        )}`}
                                                    >
                                                        {item.level}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-950/40">
                                            Everything looks steady right now.
                                            No urgent operational alerts.
                                        </div>
                                    )}
                                </div>
                            </DashboardSurface>

                            <DashboardSurface
                                title="Branch Performance"
                                description="Top branch momentum over the last 30 days."
                                className="xl:col-span-4"
                            >
                                <div className="space-y-3">
                                    {financeStats?.branchPerformance?.length ? (
                                        financeStats.branchPerformance.map(
                                            (branch, index) => (
                                                <div
                                                    key={branch.branchId}
                                                    className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-950/40"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {branch.branchName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Rank #{index + 1}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-semibold text-foreground">
                                                                {formatPrice(
                                                                    branch.revenue,
                                                                )}{' '}
                                                                ؋
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Revenue
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-neutral-900">
                                                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                                                Orders
                                                            </p>
                                                            <p className="mt-1 text-base font-semibold text-foreground">
                                                                {formatNumber(
                                                                    branch.completedOrders,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-neutral-900">
                                                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                                                Net Profit
                                                            </p>
                                                            <p className="mt-1 text-base font-semibold text-foreground">
                                                                {formatPrice(
                                                                    branch.netProfit,
                                                                )}{' '}
                                                                ؋
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-950/40">
                                            Branch performance data will show
                                            here as daily metrics accumulate.
                                        </div>
                                    )}
                                </div>
                            </DashboardSurface>

                            <DashboardSurface
                                title="Low Stock Quick List"
                                description="Fast visibility into items closest to running out."
                                className="xl:col-span-4"
                            >
                                <div className="space-y-3">
                                    {inventoryStats?.lowStockQuickList?.length ? (
                                        inventoryStats.lowStockQuickList.map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-950/40"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-foreground">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.branch}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                item.status ===
                                                                'out'
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                                                            }`}
                                                        >
                                                            {item.status ===
                                                            'out'
                                                                ? 'Out'
                                                                : 'Low'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex items-end justify-between gap-3">
                                                        <div>
                                                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                                                Quantity
                                                            </p>
                                                            <p className="mt-1 text-lg font-semibold text-foreground">
                                                                {formatNumber(
                                                                    item.quantity,
                                                                )}{' '}
                                                                {item.unit ?? ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-950/40">
                                            No low-stock items right now.
                                        </div>
                                    )}
                                </div>
                            </DashboardSurface>
                        </div>

                        {canViewOrders ? (
                            <div className="relative flex-1 overflow-hidden pb-1">
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                                    <div className="w-full min-w-0 lg:col-span-3">
                                        <Card className="h-full w-full min-w-0 rounded-2xl border border-neutral-200/70 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                                            <CardHeader>
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg font-semibold">
                                                        Top Ordered Dishes
                                                    </CardTitle>
                                                    <CardDescription className="text-sm">
                                                        Most ordered dishes of
                                                        all time
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3.5">
                                                {topOrderedDishes.map((item, index) => (
                                                    <div
                                                        key={`${item.product_name}-${index}`}
                                                        className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.92)_0%,rgba(255,255,255,1)_100%)] px-3.5 py-3.5 dark:border-neutral-800 dark:bg-neutral-950/60"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200/70 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                                                                <Dot className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium tracking-tight">
                                                                    {item.product_name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.category_name}{' '}
                                                                    •{' '}
                                                                    {formatNumber(
                                                                        item.total_quantity,
                                                                    )}{' '}
                                                                    orders
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-neutral-800">
                                                            #{index + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                                {topOrderedDishes.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        No order data available
                                                        yet.
                                                    </p>
                                                ) : null}
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="w-full min-w-0 lg:col-span-9">
                                        <Card className="h-full w-full min-w-0 rounded-2xl border border-neutral-200/70 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                                            <CardHeader className="flex flex-row items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg font-semibold">
                                                        Recent Orders
                                                    </CardTitle>
                                                    <CardDescription className="text-sm">
                                                        Latest orders across
                                                        branches
                                                    </CardDescription>
                                                </div>
                                                <a
                                                    href="/orders"
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    View all
                                                </a>
                                            </CardHeader>
                                            <CardContent className="max-h-[28rem] overflow-y-auto">
                                                <div className="min-w-0 overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>
                                                                    Order #
                                                                </TableHead>
                                                                <TableHead>
                                                                    Type
                                                                </TableHead>
                                                                <TableHead>
                                                                    Items
                                                                </TableHead>
                                                                <TableHead>
                                                                    QTY
                                                                </TableHead>
                                                                <TableHead>
                                                                    Status
                                                                </TableHead>
                                                                <TableHead className="text-right">
                                                                    Total
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {recentOrders.map(
                                                                (order) => (
                                                                    <TableRow
                                                                        key={
                                                                            order.id
                                                                        }
                                                                        className="border-neutral-200/70 dark:border-neutral-800"
                                                                    >
                                                                        <TableCell className="font-medium">
                                                                            #
                                                                            {
                                                                                order.id
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className="capitalize">
                                                                            {order.order_type?.replace(
                                                                                '_',
                                                                                ' ',
                                                                            ) ??
                                                                                '-'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {order.items
                                                                                ?.slice(
                                                                                    0,
                                                                                    2,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        item,
                                                                                    ) =>
                                                                                        item
                                                                                            .product
                                                                                            ?.name ??
                                                                                        'Unknown Item',
                                                                                )
                                                                                .join(
                                                                                    ', ',
                                                                                ) ||
                                                                                '-'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {order.items?.reduce(
                                                                                (
                                                                                    total,
                                                                                    item,
                                                                                ) =>
                                                                                    total +
                                                                                    Number(
                                                                                        item.quantity,
                                                                                    ),
                                                                                0,
                                                                            ) ??
                                                                                0}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span
                                                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClass(
                                                                                    order.status,
                                                                                )}`}
                                                                            >
                                                                                {formatOrderStatus(
                                                                                    order.status,
                                                                                )}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-medium">
                                                                            {formatPrice(
                                                                                order.total_amount,
                                                                            )}{' '}
                                                                            ؋
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ),
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                                <div className="mt-4 text-right">
                                                    <a
                                                        href="/orders"
                                                        className="flex justify-end gap-2 text-sm font-medium text-primary hover:underline"
                                                    >
                                                        Go to orders
                                                        <ArrowRight className="h-5 w-5" />
                                                    </a>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <Card className="border border-neutral-200/50 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">
                                Dashboard access is ready
                            </CardTitle>
                            <CardDescription className="text-sm">
                                This user does not have any dashboard widgets
                                assigned yet. Add section permissions to the
                                role to show operations, inventory, finance, or
                                reporting views here.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
