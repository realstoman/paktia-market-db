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
import { mockPeakDayData } from '@/test-data/order-analytics';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarIcon,
    ChefHat,
    Cherry,
    CookingPot,
    Package,
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
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}
function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

interface DashboardProps {
    data?: {
        orders: {
            pending: number;
        };
    };
}

export default function Dashboard({ data }: DashboardProps) {
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [month, setMonth] = React.useState<Date | undefined>(date);
    const [value, setValue] = React.useState(formatDate(date));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl">
                {/* Statistics */}
                <div className="grid auto-rows-min gap-6 md:grid-cols-4">
                    <div className="col-span-1 flex flex-col gap-6">
                        <Card className="relative overflow-hidden rounded-xl border border-neutral-100/90 bg-white pt-4 pb-6 dark:border-neutral-800/90 dark:bg-neutral-900">
                            <CardHeader>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold">
                                        Profit & Expenses
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Restaurant profit and expense
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <div className="space-y-2 border-b border-b-accent-foreground/5 pb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-accent-foreground/80" />
                                        <p className="text-base font-medium text-accent-foreground/80">
                                            Profit
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <p className="text-xl font-semibold text-accent-foreground/80">
                                            12,475,365.00
                                        </p>
                                        <span>؋</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <p className="text-sm font-normal text-accent-foreground/50">
                                            Jan 2026
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 border-b border-b-accent-foreground/5 pb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="h-5 w-5 text-accent-foreground/80" />
                                        <p className="text-base font-medium text-accent-foreground/80">
                                            Expenses
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <p className="text-xl font-semibold text-accent-foreground/80">
                                            7,321,270.00
                                        </p>
                                        <span>؋</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <p className="text-sm font-normal text-accent-foreground/50">
                                            Jan 2026
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 pb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="h-5 w-5 text-accent-foreground/80" />
                                        <p className="text-base font-medium text-accent-foreground/80">
                                            Orders
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <p className="text-xl font-semibold text-accent-foreground/80">
                                            10,321,270.00
                                        </p>
                                        <span>؋</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <p className="text-sm font-normal text-accent-foreground/50">
                                            Jan 2026
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <BarChartDefault />
                        </div>
                    </div>
                    {/* Order status overview */}
                    <Card className="col-span-2 flex h-full flex-col justify-between overflow-hidden rounded-xl border border-neutral-100/90 bg-white py-4 dark:border-neutral-800/90 dark:bg-neutral-900">
                        <div className="flex flex-row items-start justify-between pb-2">
                            <CardHeader className="items-left flex flex-1 flex-col justify-between space-y-1 px-6">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold">
                                        Order Status Overview
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Track real-time order progress
                                    </CardDescription>
                                </div>
                                <div className="space-y-4">
                                    <StatusCard
                                        title="Pending Orders"
                                        value={data?.orders.pending || 137}
                                        color=""
                                        icon={<ChefHat className="h-5 w-5" />}
                                    />
                                    <StatusCard
                                        title="Preparing Orders"
                                        value={data?.orders.pending || 462}
                                        color=""
                                        icon={
                                            <CookingPot className="h-4 w-4" />
                                        }
                                    />
                                    <StatusCard
                                        title="Completed Orders"
                                        value={data?.orders.pending || 344}
                                        color=""
                                        icon={<Utensils className="h-4 w-4" />}
                                    />
                                    <StatusCard
                                        title="Cancelled Orders"
                                        value={data?.orders.pending || 2}
                                        color=""
                                        icon={<X className="h-4 w-4" />}
                                    />
                                </div>
                            </CardHeader>
                            <div className="bottom-0 flex flex-1 flex-col items-end justify-between">
                                <div className="pt-2 pr-4 pb-4">
                                    <Field className="w-40">
                                        <InputGroup>
                                            <InputGroupInput
                                                id="date-required"
                                                value={value}
                                                onChange={(e) => {
                                                    const date = new Date(
                                                        e.target.value,
                                                    );
                                                    setValue(e.target.value);
                                                    if (isValidDate(date)) {
                                                        setDate(date);
                                                        setMonth(date);
                                                    }
                                                }}
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
                                                                setDate(date);
                                                                setValue(
                                                                    formatDate(
                                                                        date,
                                                                    ),
                                                                );
                                                                setOpen(false);
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
                            data={mockPeakDayData}
                            title="Order Analytics"
                            description="Last 7 days order status"
                        />
                    </Card>

                    <div className="col-span-1 flex flex-col gap-6">
                        <Card className="relative overflow-hidden rounded-xl border border-neutral-100/90 bg-white pt-4 pb-6 dark:border-neutral-800/90 dark:bg-neutral-900">
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
                            <CardContent className="space-y-4 pt-0">
                                <StatusCard
                                    title="Total Items"
                                    value={data?.orders.pending || 234567}
                                    color=""
                                    icon={<Package className="h-5 w-5" />}
                                />
                                <StatusCard
                                    title="Usable Items"
                                    value={data?.orders.pending || 7652}
                                    color=""
                                    icon={<Cherry className="h-4 w-4" />}
                                />
                                <StatusCard
                                    title="Fixed Items"
                                    value={data?.orders.pending || 8965}
                                    color=""
                                    icon={<TvMinimal className="h-4 w-4" />}
                                />
                                <StatusCard
                                    title="Less in Stock"
                                    value={data?.orders.pending || 265}
                                    color=""
                                    icon={<TrendingDown className="h-4 w-4" />}
                                />
                            </CardContent>
                        </Card>
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PieChartDonutText />
                        </div>
                    </div>
                </div>

                {/* Recent orders and top foods */}
                <div className="relative min-h-[100vh] flex-1 overflow-hidden pb-1 md:min-h-min">
                    <div className="grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                            <Card className="h-full border border-neutral-100/90 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
                                <CardHeader>
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold">
                                            Top Ordered Dishes
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Most ordered dishes this month
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        {
                                            name: 'Qabuli Palaw',
                                            orders: 1880,
                                        },
                                        {
                                            name: 'Baba Special Salam',
                                            orders: 1520,
                                        },
                                        {
                                            name: 'Baba Special Pizza',
                                            orders: 1392,
                                        },
                                        {
                                            name: 'Chicken Chawmen',
                                            orders: 1265,
                                        },
                                        {
                                            name: 'Chopan Kabab',
                                            orders: 1142,
                                        },
                                        {
                                            name: 'Grilled Fish',
                                            orders: 980,
                                        },
                                    ].map((item, index) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center justify-between rounded-lg border border-neutral-200/60 px-3 py-2 dark:border-neutral-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                                    <CookingPot className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.orders.toLocaleString()}{' '}
                                                        orders
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                #{index + 1}
                                            </span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-8">
                            <Card className="h-full border border-neutral-100/90 bg-white shadow-none dark:border-neutral-800/90 dark:bg-neutral-900">
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
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order #</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>QTY</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">
                                                    Total
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                {
                                                    id: '4821',
                                                    type: 'dine-in',
                                                    items: 'Qabuli Palaw',
                                                    qty: 3,
                                                    status: 'completed',
                                                    total: '1,245.00',
                                                },
                                                {
                                                    id: '4822',
                                                    type: 'delivery',
                                                    items: 'Chopan Kabab',
                                                    qty: 2,
                                                    status: 'preparing',
                                                    total: '820.00',
                                                },
                                                {
                                                    id: '4823',
                                                    type: 'pickup',
                                                    items: 'Shawarma',
                                                    qty: 2,
                                                    status: 'pending',
                                                    total: '560.00',
                                                },
                                                {
                                                    id: '4824',
                                                    type: 'dine-in',
                                                    items: 'Qabuli Palaw',
                                                    qty: 3,
                                                    status: 'completed',
                                                    total: '1,020.00',
                                                },
                                                {
                                                    id: '4825',
                                                    type: 'delivery',
                                                    items: 'Grilled Fish',
                                                    qty: 2,
                                                    status: 'cancelled',
                                                    total: '1,540.00',
                                                },
                                                {
                                                    id: '4826',
                                                    type: 'pickup',
                                                    items: 'Zinger Burger',
                                                    status: 'completed',
                                                    qty: 2,
                                                    total: '430.00',
                                                },
                                                {
                                                    id: '4827',
                                                    type: 'dine-in',
                                                    items: 'Baba Special Pizza',
                                                    qty: 4,
                                                    status: 'preparing',
                                                    total: '2,800.00',
                                                },
                                                {
                                                    id: '4828',
                                                    type: 'dine-in',
                                                    items: 'Baba Special Salad',
                                                    qty: 2,
                                                    status: 'completed',
                                                    total: '500.00',
                                                },
                                            ].map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">
                                                        #{order.id}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {order.type}
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.items}
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.qty}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                                order.status ===
                                                                'completed'
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                                                    : order.status ===
                                                                        'preparing'
                                                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                                                                      : order.status ===
                                                                          'pending'
                                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                                                                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                                                            }`}
                                                        >
                                                            {order.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {order.total} ؋
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
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
            </div>
        </AppLayout>
    );
}
