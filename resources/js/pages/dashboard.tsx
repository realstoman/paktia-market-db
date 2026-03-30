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
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Order } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarIcon,
    CircleDollarSign,
    Cherry,
    Clock3,
    CookingPot,
    CreditCard,
    Dot,
    Flame,
    LayoutGrid,
    LoaderCircle,
    PackageCheck,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    TvMinimal,
    Utensils,
    X,
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
            notes: {
                netProfit: string;
                expenses: string;
                cashPosition: string;
            };
        } | null;
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

function MetricStrip({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'default',
}: {
    label: string;
    value: string;
    hint?: string;
    icon: React.ElementType;
    tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
    const toneClasses = {
        default:
            'border-neutral-200/70 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-200',
        success:
            'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
        warning:
            'border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
        danger:
            'border-red-200/70 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300',
    } as const;

    return (
        <div className="rounded-xl border border-neutral-200/70 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {value}
                    </p>
                </div>
                <div
                    className={cn(
                        'rounded-full border p-2',
                        toneClasses[tone],
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            {hint ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {hint}
                </p>
            ) : null}
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
    const canViewOrders = ordersStats !== null && ordersStats !== undefined;
    const canViewInventory =
        inventoryStats !== null && inventoryStats !== undefined;
    const canViewFinance = financeStats !== null && financeStats !== undefined;
    const hasAnySection = canViewOrders || canViewInventory || canViewFinance;
    const orderMetricTiles = [
        {
            label: 'Pending',
            value: ordersStats?.pending ?? 0,
            icon: Clock3,
            tone: 'default' as const,
        },
        {
            label: 'Preparing',
            value: ordersStats?.in_progress ?? 0,
            icon: CookingPot,
            tone: 'warning' as const,
        },
        {
            label: 'Ready',
            value: ordersStats?.ready ?? 0,
            icon: PackageCheck,
            tone: 'default' as const,
        },
        {
            label: 'Completed',
            value: ordersStats?.completed ?? 0,
            icon: Utensils,
            tone: 'success' as const,
        },
        {
            label: 'Cancelled',
            value: ordersStats?.cancelled ?? 0,
            icon: X,
            tone: 'danger' as const,
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
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                            {canViewFinance ? (
                                <DashboardSurface
                                    title="Finance Snapshot"
                                    description="A clean read of profitability and cash health."
                                    className="xl:col-span-4"
                                >
                                    <div className="grid gap-3">
                                        <MetricStrip
                                            label="Net Profit"
                                            value={`${formatPrice(
                                                financeStats?.netProfit ?? 0,
                                            )} ؋`}
                                            hint={financeStats?.notes.netProfit}
                                            icon={CircleDollarSign}
                                            tone="success"
                                        />
                                        <MetricStrip
                                            label="Expenses"
                                            value={`${formatPrice(
                                                financeStats?.expenses ?? 0,
                                            )} ؋`}
                                            hint={financeStats?.notes.expenses}
                                            icon={TrendingDown}
                                            tone="warning"
                                        />
                                        <MetricStrip
                                            label="Cash Position"
                                            value={`${formatPrice(
                                                financeStats?.cashPosition ?? 0,
                                            )} ؋`}
                                            hint={
                                                financeStats?.notes.cashPosition
                                            }
                                            icon={CreditCard}
                                        />
                                        {financeStats?.projectionHealth ? (
                                            <div className="rounded-xl border border-dashed border-neutral-200/80 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-950/50">
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
                                                                .projectionHealth
                                                                .status
                                                        }
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                                    {
                                                        financeStats
                                                            .projectionHealth
                                                            .message
                                                    }
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </DashboardSurface>
                            ) : null}

                            {canViewOrders ? (
                                <DashboardSurface
                                    title="Orders Today"
                                    description={`Operational view for ${formattedSelectedDate}.`}
                                    className="xl:col-span-4"
                                    headerAction={
                                        <Field className="w-44">
                                            <InputGroup>
                                                <InputGroupInput
                                                    id="date-required"
                                                    value={value}
                                                    readOnly
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'ArrowDown') {
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
                                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                                        {orderMetricTiles.map((item) => (
                                            <MetricStrip
                                                key={item.label}
                                                label={item.label}
                                                value={formatNumber(
                                                    item.value,
                                                )}
                                                icon={item.icon}
                                                tone={item.tone}
                                            />
                                        ))}
                                        <div className="rounded-xl border border-neutral-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbfb_70%,rgba(16,47,51,0.08)_100%)] p-3 dark:border-neutral-800 dark:bg-neutral-950/60 xl:col-span-1">
                                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                                Live pulse
                                            </p>
                                            <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                                                <LoaderCircle className="h-4 w-4 text-primary" />
                                                Service rhythm is centered on
                                                volume, readiness, and flow.
                                            </div>
                                        </div>
                                    </div>
                                </DashboardSurface>
                            ) : null}

                            {canViewInventory ? (
                                <DashboardSurface
                                    title="Inventory Health"
                                    description="Inventory strength, exposure, and stock pressure."
                                    className="xl:col-span-4"
                                >
                                    <div className="grid gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <MetricStrip
                                                label="Total Items"
                                                value={formatNumber(
                                                    inventoryStats?.totalItems ??
                                                        0,
                                                )}
                                                icon={LayoutGrid}
                                            />
                                            <MetricStrip
                                                label="Inventory Value"
                                                value={`${formatPrice(
                                                    inventoryStats?.inventoryValue ??
                                                        0,
                                                )} ؋`}
                                                icon={TrendingUp}
                                            />
                                            <MetricStrip
                                                label="Usable"
                                                value={formatNumber(
                                                    inventoryStats?.totalUsableItems ??
                                                        0,
                                                )}
                                                icon={Cherry}
                                                tone="success"
                                            />
                                            <MetricStrip
                                                label="Fixed"
                                                value={formatNumber(
                                                    inventoryStats?.totalFixedItems ??
                                                        0,
                                                )}
                                                icon={TvMinimal}
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
                            {canViewFinance ? (
                                <DashboardSurface
                                    title="Net Profit Trend"
                                    description="Month-over-month performance at a glance."
                                    className="xl:col-span-4"
                                >
                                    <BarChartDefault
                                        data={
                                            financeStats?.monthlyNetProfit ?? []
                                        }
                                    />
                                </DashboardSurface>
                            ) : null}

                            {canViewOrders ? (
                                <DashboardSurface
                                    title="Order Analytics"
                                    description="Seven-day movement across pending, kitchen, and completion stages."
                                    className="xl:col-span-4"
                                >
                                    <OrderAnalyticsChart
                                        data={orderAnalyticsData}
                                        title="Order Flow"
                                        description="Past 7 days"
                                    />
                                </DashboardSurface>
                            ) : null}

                            {canViewInventory ? (
                                <DashboardSurface
                                    title="Inventory Distribution"
                                    description="How stock is split across active, fixed, and risk categories."
                                    className="xl:col-span-4"
                                >
                                    <PieChartDonutText
                                        total={inventoryStats?.totalItems ?? 0}
                                        totalFixedItems={
                                            inventoryStats?.totalFixedItems ?? 0
                                        }
                                        totalUsableItems={
                                            inventoryStats?.totalUsableItems ??
                                            0
                                        }
                                        lowStockItems={
                                            inventoryStats?.lowStockItems ?? 0
                                        }
                                        outOfStockItems={
                                            inventoryStats?.outOfStockItems ?? 0
                                        }
                                    />
                                </DashboardSurface>
                            ) : null}
                        </div>

                {/* Recent orders and top foods */}
                {canViewOrders ? (
                <div className="relative flex-1 overflow-hidden pb-1">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                        <div className="w-full min-w-0 lg:col-span-4">
                            <Card className="h-full w-full min-w-0 rounded-2xl border border-neutral-200/70 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                                <CardHeader>
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold">
                                            Top Ordered Dishes
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Most ordered dishes of all time
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {topOrderedDishes.map((item, index) => (
                                        <div
                                            key={`${item.product_name}-${index}`}
                                            className="flex items-center justify-between rounded-xl border border-neutral-200/60 bg-neutral-50/70 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/60"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/70 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                                                    <CookingPot className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.category_name} •{' '}
                                                        {formatNumber(
                                                            item.total_quantity,
                                                        )}{' '}
                                                        orders
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Dot className="h-4 w-4" />
                                                #{index + 1}
                                            </div>
                                        </div>
                                    ))}
                                    {topOrderedDishes.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No order data available yet.
                                        </p>
                                    ) : null}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="w-full min-w-0 lg:col-span-8">
                            <Card className="h-full w-full min-w-0 rounded-2xl border border-neutral-200/70 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold">
                                            Recent Orders
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Latest orders across branches
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
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Items</TableHead>
                                                    <TableHead>QTY</TableHead>
                                                    <TableHead>
                                                        Status
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Total
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {recentOrders.map((order) => (
                                                    <TableRow key={order.id}>
                                                        <TableCell className="font-medium">
                                                            #{order.id}
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                            {order.order_type?.replace(
                                                                '_',
                                                                ' ',
                                                            ) ?? '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {order.items
                                                                ?.slice(0, 2)
                                                                .map(
                                                                    (item) =>
                                                                        item
                                                                            .product
                                                                            ?.name ??
                                                                        'Unknown Item',
                                                                )
                                                                .join(', ') ||
                                                                '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {order.items?.reduce(
                                                                (total, item) =>
                                                                    total +
                                                                    Number(
                                                                        item.quantity,
                                                                    ),
                                                                0,
                                                            ) ?? 0}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getOrderStatusBadgeClass(
                                                                    order.status,
                                                                )}`}
                                                            >
                                                                {formatOrderStatus(
                                                                    order.status,
                                                                )}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatPrice(
                                                                order.total_amount,
                                                            )}{' '}
                                                            ؋
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
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
                                This user does not have any dashboard widgets assigned yet. Add section permissions to the role to show operations, inventory, finance, or reporting views here.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
