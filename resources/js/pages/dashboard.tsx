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
import { illustrations } from '@/config/brand';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { mockPeakDayData } from '@/test-data/order-analytics';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
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
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-xl">
                <div className="grid auto-rows-min gap-2 md:grid-cols-4">
                    <div className="col-span-1 flex flex-col gap-2">
                        <Card className="relative overflow-hidden rounded-xl border-none bg-white pt-4 pb-6 dark:bg-neutral-900">
                            <CardHeader>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold">
                                        Profit & Expenses
                                    </CardTitle>
                                    <CardDescription className="text-ms">
                                        Restaurant profit and expense
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <div className="space-y-2 border-b border-b-accent-foreground/10 pb-4">
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
                                <div className="space-y-2 border-b border-b-accent-foreground/10 pb-4">
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
                    <Card className="col-span-2 flex h-full flex-col justify-between overflow-hidden rounded-xl border-none py-4 dark:bg-neutral-900">
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

                    <div className="col-span-1 flex flex-col gap-2">
                        <Card className="relative overflow-hidden rounded-xl border-none bg-white pt-4 pb-6 dark:bg-neutral-900">
                            <CardHeader>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold">
                                        Inventory Overview
                                    </CardTitle>
                                    <CardDescription className="text-ms">
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
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 md:min-h-min dark:border-sidebar-border dark:bg-neutral-900">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Ipsa quae amet perspiciatis qui maxime, fuga deserunt velit
                    doloribus consequatur, soluta dignissimos, ab suscipit
                    molestiae odit. Similique vitae autem quam, sunt odit
                    architecto, suscipit animi qui ullam quas alias accusantium
                    rem cum quisquam inventore officiis. Animi itaque aliquid
                    ullam nostrum commodi, nesciunt iure, ab ex magnam maxime
                    sunt iste praesentium delectus cupiditate numquam, debitis
                    laborum ipsam expedita nam quia beatae velit hic.
                    Consequuntur inventore tempora, sapiente dicta suscipit illo
                    quis veniam unde odit, quos assumenda aliquam alias quaerat
                    adipisci, nulla eaque. Vel, dolore laborum quos corrupti
                    dolores illo explicabo ducimus beatae autem facere mollitia
                    pariatur nesciunt, eum hic consequuntur tempore sint ipsam
                    reiciendis obcaecati cupiditate id, ad quo quam rem! Vitae
                    numquam minus voluptas suscipit sit praesentium? Sint id
                    minus alias esse voluptas animi laborum hic perspiciatis ea
                    nemo ad amet fugiat qui, vel nostrum cumque delectus libero
                    officia pariatur nihil molestiae officiis possimus enim!
                    Magnam voluptates omnis ea esse nostrum velit quas eos
                    autem, repudiandae nulla unde eaque similique sit qui,
                    delectus molestias tempore vel nobis possimus ullam! Officia
                    sunt recusandae eveniet laudantium tempore! Voluptatum
                    tempore, repudiandae provident eligendi suscipit veniam.
                    Nisi necessitatibus sunt laboriosam fuga iure accusantium
                    dolorum quam! Lorem ipsum dolor sit amet consectetur
                    adipisicing elit. Odit doloribus odio maiores ipsam fugiat,
                    sequi magni numquam quis quasi deserunt nisi iste eligendi
                    recusandae possimus aliquam. Neque inventore architecto in,
                    saepe aliquam quod dolore ipsum sed ut! Natus, nulla sunt?
                    Eum rerum minus recusandae eligendi? Eligendi esse
                    reprehenderit earum sed magnam, sapiente minima, nam rem
                    explicabo quos beatae animi totam obcaecati labore! Officiis
                    sit corporis assumenda eius odit commodi eligendi, quidem
                    officia hic accusantium ea voluptate ducimus deleniti,
                    consequatur nam blanditiis nulla eaque fuga. Iure, sequi
                    quidem? Voluptatum animi repudiandae quas odio, voluptas
                    autem dolor ex repellat enim sequi dolore nulla inventore
                    mollitia fuga, ut eligendi, sunt optio eaque quibusdam
                    tempore neque praesentium officia! Corrupti, dolorem eos
                    repudiandae blanditiis ipsam veniam. Eveniet tempore nemo
                    odit nihil! Inventore, hic? Earum illum similique vitae
                    mollitia facilis? Labore a excepturi quibusdam hic non
                    possimus, in dolores sed. Ad explicabo quaerat libero
                    consectetur quidem, omnis id laboriosam voluptatum error
                    ratione deleniti expedita debitis ea eius nisi illo delectus
                    molestias sit sint blanditiis et quo? Temporibus nobis
                    repellendus voluptatum consectetur velit pariatur ex
                    assumenda nesciunt commodi blanditiis repudiandae ipsum
                    illum mollitia consequuntur vel earum laboriosam neque,
                    laborum obcaecati rerum placeat at deserunt veniam illo?
                    Tenetur sed quis cumque itaque rem iusto ipsum laudantium
                    illum deserunt blanditiis? Dignissimos harum quod ea
                    exercitationem in expedita magni quos quaerat iusto amet eum
                    voluptates aut beatae repellendus impedit rerum non aliquam,
                    sed odit a autem blanditiis delectus consectetur? Repellat
                    perspiciatis ipsum dolore ea eum at impedit enim, rerum quod
                    ratione! Sed quasi autem ad architecto quo dolores
                    repellendus veniam atque labore. Blanditiis commodi quas
                    impedit aliquid rem. Placeat eligendi et maiores porro?
                    Dolores voluptate enim ipsa obcaecati nemo, officia culpa
                    laudantium libero vel repudiandae et ad, est id tempora,
                    eius distinctio eaque praesentium voluptas ex expedita
                    quidem cum! Expedita?
                </div>
            </div>
        </AppLayout>
    );
}
