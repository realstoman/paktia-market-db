import { BarChartDefault } from '@/components/charts/bar-chart-default';
import { OrderAnalyticsChart } from '@/components/charts/order-analytics-chart';
import { PieChartDonutText } from '@/components/charts/pie-chart-donut';
import StatusCard from '@/components/shared/StatusCard';
import { Calendar } from '@/components/ui/calendar';
import { Field } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { illustrations } from '@/config/brand';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { mockPeakDayData } from '@/test-data/order-analytics';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    CalendarIcon,
    ChefHat,
    Clock,
    CookingPot,
    SquareX,
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
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <BarChartDefault />
                        </div>
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <BarChartDefault />
                        </div>
                    </div>
                    {/* Order status overview */}
                    <div className="col-span-2 flex h-full flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="flex">
                            <div className="items-left flex flex-1 flex-col justify-between p-6">
                                <div className="pb-4">
                                    <h1 className="text-2xl font-medium">
                                        Order Status Overview
                                    </h1>
                                    <p className="text-base">
                                        Track real-time order progress
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <StatusCard
                                        title="Pending Orders"
                                        value={data?.orders.pending || 137}
                                        color="bg-neutral-50"
                                        icon={<ChefHat className="h-5 w-5" />}
                                    />
                                    <StatusCard
                                        title="Preparing Orders"
                                        value={data?.orders.pending || 462}
                                        color="bg-sky-50 text-sky-700"
                                        icon={
                                            <CookingPot className="h-4 w-4" />
                                        }
                                    />
                                    <StatusCard
                                        title="Completed Orders"
                                        value={data?.orders.pending || 344}
                                        color="bg-green-50 text-green-700"
                                        icon={<Utensils className="h-4 w-4" />}
                                    />
                                    <StatusCard
                                        title="Cancelled Orders"
                                        value={data?.orders.pending || 2}
                                        color="bg-red-50 text-red-700"
                                        icon={<X className="h-4 w-4" />}
                                    />
                                </div>
                            </div>
                            <div className="bottom-0 flex flex-1 flex-col items-end justify-between">
                                <div className="pt-6 pr-4 pb-4">
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
                    </div>

                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
                            <div className="pb-4">
                                <h1 className="text-lg font-medium lg:text-xl">
                                    Inventory Overview
                                </h1>
                                <p className="text-md: lg:text-base">
                                    Track inventory status
                                </p>
                            </div>
                            <div className="space-y-2">
                                <StatusCard
                                    title="Pending Orders"
                                    value={data?.orders.pending || 137}
                                    color=""
                                    icon={<Clock className="h-5 w-5" />}
                                />
                                <StatusCard
                                    title="Preparing Orders"
                                    value={data?.orders.pending || 462}
                                    color=""
                                    icon={<CookingPot className="h-4 w-4" />}
                                />
                                <StatusCard
                                    title="Completed Orders"
                                    value={data?.orders.pending || 344}
                                    color=""
                                    icon={<Utensils className="h-4 w-4" />}
                                />
                                <StatusCard
                                    title="Cancelled Orders"
                                    value={data?.orders.pending || 0}
                                    color=""
                                    icon={<SquareX className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PieChartDonutText />
                        </div>
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
