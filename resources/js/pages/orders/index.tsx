'use client';

import InputError from '@/components/input-error';
import { OrderStatusStatCard } from '@/components/shared/order-status-stat-card';
import { OrdersClient } from '@/components/tables/orders/client';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { Branch, BranchTable, BreadcrumbItem, Order, Product } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleX,
    Clock3,
    CookingPot,
    FilterX,
    type LucideIcon,
    PackageCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Orders',
        href: '/orders',
    },
];

interface OrdersPageProps {
    orders: Order[];
    branches: Branch[];
    products: Product[];
    branchTables: BranchTable[];
    selectedDate: string | null;
    isAllTime: boolean;
    restaurantStartDate: string | null;
}

type OrderStatusKey =
    | 'pending'
    | 'in_progress'
    | 'ready'
    | 'completed'
    | 'cancelled';

interface StatusCardConfig {
    key: OrderStatusKey;
    title: string;
    icon: LucideIcon;
}

const STATUS_CARDS: StatusCardConfig[] = [
    { key: 'ready', title: 'Ready', icon: PackageCheck },
    { key: 'completed', title: 'Completed', icon: CheckCircle2 },
    { key: 'in_progress', title: 'In Progress', icon: CookingPot },
    { key: 'pending', title: 'Pending', icon: Clock3 },
    { key: 'cancelled', title: 'Cancelled', icon: CircleX },
];

export default function OrdersPage({
    orders,
    branches,
    products,
    branchTables,
    selectedDate,
    isAllTime,
    restaurantStartDate,
}: OrdersPageProps) {
    const [selectedStatus, setSelectedStatus] = useState<OrderStatusKey | null>(
        null,
    );
    const [dateFilter, setDateFilter] = useState(selectedDate ?? '');
    const [dateError, setDateError] = useState('');

    const todayDate = useMemo(
        () =>
            selectedDate
                ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                      'en-US',
                      {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                      },
                  )
                : '',
        [selectedDate],
    );

    const restaurantStartedDate = useMemo(
        () =>
            restaurantStartDate
                ? new Date(restaurantStartDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                  })
                : null,
        [restaurantStartDate],
    );

    const stats = useMemo(() => {
        const initial = {
            ready: 0,
            in_progress: 0,
            pending: 0,
            completed: 0,
            cancelled: 0,
        } as Record<OrderStatusKey, number>;

        for (const order of orders) {
            const status = (order.status ?? 'pending') as OrderStatusKey;
            if (status in initial) {
                initial[status] += 1;
            }
        }

        return initial;
    }, [orders]);

    const selectedCard = STATUS_CARDS.find(
        (card) => card.key === selectedStatus,
    );
    const selectedOrders = orders.filter(
        (order) => (order.status ?? 'pending') === selectedStatus,
    );
    const topRowStatusCards = STATUS_CARDS.slice(0, 2);
    const bottomRowStatusCards = STATUS_CARDS.slice(2);

    const handleDateSubmit = () => {
        if (!dateFilter) {
            setDateError('Please select a date.');
            return;
        }

        setDateError('');

        router.get(
            '/orders',
            { date: dateFilter },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handleClearFilter = () => {
        setDateError('');
        setDateFilter('');

        router.get(
            '/orders',
            { all_time: 1 },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="space-y-3 py-2">
                <div className="flex justify-end">
                    <div className="w-full max-w-md space-y-1">
                        <div className="flex items-end justify-end gap-2">
                            <div className="w-full bg-white dark:bg-neutral-900">
                                <Input
                                    type="date"
                                    className="h-10"
                                    value={dateFilter}
                                    onChange={(event) =>
                                        setDateFilter(event.target.value)
                                    }
                                />
                            </div>
                            <Button
                                type="button"
                                className="h-10 shrink-0"
                                onClick={handleDateSubmit}
                            >
                                Submit
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 shrink-0 gap-1.5"
                                onClick={handleClearFilter}
                            >
                                <FilterX className="h-4 w-4" />
                                Clear
                            </Button>
                        </div>
                        <InputError message={dateError} />
                    </div>
                </div>

                <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f7fbfb_0%,#edf4f4_45%,#ffffff_100%)] p-4 shadow-none dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#16373b_0%,#102f33_45%,#0d2225_100%)]">
                    <div className="grid grid-cols-1 gap-3 pt-0 md:grid-cols-12">
                    <Card className="gap-3 overflow-hidden border-white/80 bg-[linear-gradient(135deg,#f1f7f6_0%,#e6f0ef_55%,#ffffff_100%)] pt-4 pb-0 shadow-none md:col-span-4 md:row-span-2 dark:border-white/10 dark:bg-[linear-gradient(135deg,#173a3f_0%,#102f33_52%,#0f2528_100%)]">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-xl text-[#102F33] dark:text-white">
                                Baba Restaurant
                            </CardTitle>
                            <CardDescription className="text-sm text-[#35565a] dark:text-neutral-300">
                                {isAllTime
                                    ? 'All time records for orders'
                                    : `Order statistics for ${todayDate}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-2xl font-semibold text-[#102F33] dark:text-white">
                                {formatNumber(orders.length)}
                            </p>
                            <p className="text-xs text-[#4c6a6e] dark:text-neutral-300">
                                {isAllTime
                                    ? `All time since ${restaurantStartedDate ?? '-'}`
                                    : 'Total orders today'}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-3 md:col-span-8 md:grid-cols-12">
                        {topRowStatusCards.map((card) => {
                            return (
                                <OrderStatusStatCard
                                    key={card.key}
                                    title={card.title}
                                    value={formatNumber(stats[card.key])}
                                    icon={card.icon}
                                    className="md:col-span-6"
                                    onDetailsClick={() =>
                                        setSelectedStatus(card.key)
                                    }
                                />
                            );
                        })}

                        {bottomRowStatusCards.map((card) => {
                            return (
                                <OrderStatusStatCard
                                    key={card.key}
                                    title={card.title}
                                    value={formatNumber(stats[card.key])}
                                    icon={card.icon}
                                    className="md:col-span-4"
                                    onDetailsClick={() =>
                                        setSelectedStatus(card.key)
                                    }
                                />
                            );
                        })}
                    </div>
                    </div>
                </section>

                <div className="rounded-lg border border-neutral-200 bg-white p-6 text-gray-900 shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <OrdersClient
                        data={orders}
                        branches={branches}
                        products={products}
                        branchTables={branchTables}
                    />
                </div>
            </div>

            <Drawer
                open={Boolean(selectedStatus)}
                onOpenChange={(open) => !open && setSelectedStatus(null)}
                direction="right"
            >
                <DrawerContent className="h-screen w-full p-0 data-[vaul-drawer-direction=right]:sm:max-w-xl">
                    <DrawerHeader className="sticky top-0 z-10 border-b bg-background">
                        <DrawerTitle>
                            {selectedCard?.title ?? 'Status'} Orders
                        </DrawerTitle>
                        <DrawerDescription>
                            Orders currently in{' '}
                            {selectedCard?.title.toLowerCase() ?? 'selected'}{' '}
                            status.
                        </DrawerDescription>
                    </DrawerHeader>

                    <ScrollArea className="h-[calc(100vh-88px)] px-4 pb-4">
                        <div className="space-y-2 py-4">
                            {selectedOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No orders found for this status.
                                </p>
                            ) : (
                                selectedOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="rounded-md border border-neutral-200/70 p-3 dark:border-neutral-800"
                                    >
                                        <p className="font-medium">
                                            Order #{order.id}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Branch:{' '}
                                            {order.branch?.name ??
                                                'Unknown branch'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Total:{' '}
                                            {formatAfn(order.total_amount)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </DrawerContent>
            </Drawer>
        </AppLayout>
    );
}
