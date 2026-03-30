import { BarChartDefault } from '@/components/charts/bar-chart-default';
import { OrderAnalyticsChart } from '@/components/charts/order-analytics-chart';
import { PieChartDonutText } from '@/components/charts/pie-chart-donut';
import StatusCard from '@/components/shared/StatusCard';
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
import { illustrations } from '@/config/brand';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Order } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarIcon,
    ChefHat,
    Cherry,
    CookingPot,
    Package,
    PackageCheck,
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
                {/* Statistics */}
                <div className="grid auto-rows-min grid-cols-1 items-stretch gap-3 md:grid-cols-4">
                    {canViewFinance ? (
                    <div className="col-span-1 flex h-full w-full min-w-0 flex-col gap-2">
                        <Card className="relative min-h-[470px] overflow-hidden rounded-xl border border-neutral-200/50 bg-[linear-gradient(135deg,#f7fbfb_0%,#edf4f4_45%,#ffffff_100%)] pt-4 pb-6 shadow-none dark:border-neutral-800/90 dark:bg-neutral-900 dark:bg-none">
                            <CardHeader>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold">
                                        Profit & Expenses
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        All-time finance snapshot. Use the
                                        Finance section for period filters.
                                    </CardDescription>
                                    {financeStats?.projectionHealth ? (
                                        <div className="pt-2">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${projectionBadgeClass(
                                                    financeStats.projectionHealth.status,
                                                )}`}
                                            >
                                                Projection{' '}
                                                {financeStats.projectionHealth.status}
                                            </span>
                                            <p className="mt-2 text-xs text-accent-foreground/60">
                                                {
                                                    financeStats
                                                        .projectionHealth
                                                        .message
                                                }
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <div className="space-y-2 border-b border-b-accent-foreground/5 pb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-accent-foreground/80" />
                                        <p className="text-base font-medium text-accent-foreground/80">
                                            Net Profit
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <p className="text-xl font-semibold text-accent-foreground/80">
                                            {formatPrice(
                                                financeStats?.netProfit ?? 0,
                                            )}
                                        </p>
                                        <span>؋</span>
                                    </div>
                                    <p className="text-sm font-normal text-accent-foreground/50">
                                        {financeStats?.notes.netProfit ??
                                            'Net profit = gross profit - expenses.'}
                                    </p>
                                </div>
                                <div className="space-y-2 border-b border-b-accent-foreground/5 pb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="h-5 w-5 text-accent-foreground/80" />
                                        <p className="text-base font-medium text-accent-foreground/80">
                                            Expenses
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <p className="text-xl font-semibold text-accent-foreground/80">
                                            {formatPrice(
                                                financeStats?.expenses ?? 0,
                                            )}
                                        </p>
                                        <span>؋</span>
                                    </div>
                                    <p className="text-sm font-normal text-accent-foreground/50">
                                        {financeStats?.notes.expenses ??
                                            'Expenses = sum of all recorded expense amounts.'}
                                    </p>
                                </div>
                                <div className="space-y-2 pb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-accent-foreground/80" />
                                        <p className="text-base font-medium text-accent-foreground/80">
                                            Cash Position
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <p className="text-xl font-semibold text-accent-foreground/80">
                                            {formatPrice(
                                                financeStats?.cashPosition ?? 0,
                                            )}
                                        </p>
                                        <span>؋</span>
                                    </div>
                                    <p className="text-sm font-normal text-accent-foreground/50">
                                        {financeStats?.notes.cashPosition ??
                                            'Cash position = cash sales - cash expenses + approved cash movements.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="relative flex-1 overflow-hidden rounded-xl border border-neutral-200/50 shadow-none dark:border-neutral-800/90">
                            <BarChartDefault
                                data={financeStats?.monthlyNetProfit ?? []}
                            />
                        </div>
                    </div>
                    ) : null}
                    {/* Order status overview */}
                    {canViewOrders ? (
                    <Card className="col-span-2 flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-200/50 bg-white pt-4 pb-0 shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                        <div className="flex flex-row items-start justify-between pb-8">
                            <CardHeader className="items-left flex flex-1 flex-col justify-between space-y-1 px-6">
                                <div className="space-y-3">
                                    <CardTitle className="text-lg font-semibold">
                                        Order Status Overview
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Order statistics for{' '}
                                        {formattedSelectedDate}
                                    </CardDescription>
                                </div>
                                <div className="space-y-5 pt-4">
                                    <StatusCard
                                        title="Pending Orders"
                                        value={formatNumber(
                                            ordersStats?.pending ?? 0,
                                        )}
                                        color=""
                                        icon={<ChefHat className="h-5 w-5" />}
                                    />
                                    <StatusCard
                                        title="Preparing Orders"
                                        value={formatNumber(
                                            ordersStats?.in_progress ?? 0,
                                        )}
                                        color=""
                                        icon={
                                            <CookingPot className="h-4 w-4" />
                                        }
                                    />
                                    <StatusCard
                                        title="Ready Orders"
                                        value={formatNumber(
                                            ordersStats?.ready ?? 0,
                                        )}
                                        color=""
                                        icon={
                                            <PackageCheck className="h-4 w-4" />
                                        }
                                    />
                                    <StatusCard
                                        title="Completed Orders"
                                        value={formatNumber(
                                            ordersStats?.completed ?? 0,
                                        )}
                                        color=""
                                        icon={<Utensils className="h-4 w-4" />}
                                    />
                                    <StatusCard
                                        title="Cancelled Orders"
                                        value={formatNumber(
                                            ordersStats?.cancelled ?? 0,
                                        )}
                                        color=""
                                        icon={<X className="h-4 w-4" />}
                                    />
                                </div>
                            </CardHeader>
                            <div className="bottom-0 flex flex-1 flex-col items-end justify-between gap-6">
                                <div className="pt-2 pr-4 pb-4">
                                    <Field className="w-40">
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

                                                                setDate(date);
                                                                setValue(
                                                                    formatDate(
                                                                        date,
                                                                    ),
                                                                );
                                                                setOpen(false);
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
                                </div>
                                <img
                                    src={`${illustrations.babaChef}`}
                                    width="350"
                                    height="180"
                                    alt="Logo"
                                />
                            </div>
                        </div>
                        <OrderAnalyticsChart
                            data={orderAnalyticsData}
                            title="Order Analytics"
                            description="Past 7 days order status"
                        />
                    </Card>
                    ) : null}

                    {canViewInventory ? (
                    <div className="col-span-1 flex h-full w-full min-w-0 flex-col gap-2">
                        <Card className="relative min-h-[470px] overflow-hidden rounded-xl border border-neutral-200/50 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] pt-4 pb-6 shadow-none dark:border-neutral-800/90 dark:bg-neutral-900 dark:bg-none">
                            <CardHeader>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold">
                                        Inventory Overview
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Track inventory status
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-0">
                                <StatusCard
                                    title="Total Items"
                                    value={formatNumber(
                                        inventoryStats?.totalItems ?? 0,
                                    )}
                                    color=""
                                    icon={<Package className="h-5 w-5" />}
                                    description="All inventory records currently tracked across the system."
                                />
                                <StatusCard
                                    title="Usable Items"
                                    value={formatNumber(
                                        inventoryStats?.totalUsableItems ?? 0,
                                    )}
                                    color=""
                                    icon={<Cherry className="h-4 w-4" />}
                                    description="Items available for kitchen and branch operations."
                                />
                                <StatusCard
                                    title="Fixed Items"
                                    value={formatNumber(
                                        inventoryStats?.totalFixedItems ?? 0,
                                    )}
                                    color=""
                                    icon={<TvMinimal className="h-4 w-4" />}
                                    description="Equipment and fixed assets held in inventory."
                                />
                                <StatusCard
                                    title="Inventory Value"
                                    value={`${formatPrice(
                                        inventoryStats?.inventoryValue ?? 0,
                                    )} ؋`}
                                    color=""
                                    icon={<TrendingUp className="h-4 w-4" />}
                                    description="Current valuation based on quantity multiplied by unit price."
                                />
                            </CardContent>
                        </Card>
                        <div className="relative flex-1 overflow-hidden rounded-xl border border-neutral-200/50 shadow-none dark:border-neutral-800/90">
                            <PieChartDonutText
                                total={inventoryStats?.totalItems ?? 0}
                                totalFixedItems={
                                    inventoryStats?.totalFixedItems ?? 0
                                }
                                totalUsableItems={
                                    inventoryStats?.totalUsableItems ?? 0
                                }
                                lowStockItems={
                                    inventoryStats?.lowStockItems ?? 0
                                }
                                outOfStockItems={
                                    inventoryStats?.outOfStockItems ?? 0
                                }
                            />
                        </div>
                    </div>
                    ) : null}
                </div>

                {/* Recent orders and top foods */}
                {canViewOrders ? (
                <div className="relative min-h-[100vh] flex-1 overflow-hidden pb-1 md:min-h-min">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                        <div className="w-full min-w-0 lg:col-span-4">
                            <Card className="h-full w-full min-w-0 border border-neutral-200/50 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
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
                                            className="flex items-center justify-between rounded-lg border border-neutral-200/60 px-3 py-2 dark:border-neutral-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
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
                                            <span className="text-xs text-muted-foreground">
                                                #{index + 1}
                                            </span>
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
                            <Card className="h-full w-full min-w-0 border border-neutral-200/50 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
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
