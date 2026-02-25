'use client';

import { OrdersClient } from '@/components/tables/orders/client';
import { OrderStatusStatCard } from '@/components/shared/order-status-stat-card';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Order, Product } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleX,
    Clock3,
    CookingPot,
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
    selectedDate: string;
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
    { key: 'in_progress', title: 'In Progress', icon: CookingPot },
    { key: 'pending', title: 'Pending', icon: Clock3 },
    { key: 'completed', title: 'Completed', icon: CheckCircle2 },
    { key: 'cancelled', title: 'Cancelled', icon: CircleX },
];

export default function OrdersPage({
    orders,
    branches,
    products,
    selectedDate,
}: OrdersPageProps) {
    const [selectedStatus, setSelectedStatus] = useState<OrderStatusKey | null>(
        null,
    );
    const [dateFilter, setDateFilter] = useState(selectedDate);
    const [dateError, setDateError] = useState('');

    const todayDate = useMemo(
        () =>
            new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
        [selectedDate],
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="space-y-3 p-2">
                <div className="flex justify-end">
                    <div className="w-full max-w-md space-y-1">
                        <div className="flex items-end justify-end gap-2">
                            <div className="w-full">
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    Filter Date
                                </label>
                                <Input
                                    type="date"
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
                        </div>
                        <InputError message={dateError} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-0 md:grid-cols-12">
                    <Card className="gap-3 border-neutral-200 bg-white pt-4 pb-0 shadow-none md:col-span-4 md:row-span-2 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-xl">
                                Baba Restaurant
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Order statistics for {todayDate}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatNumber(orders.length)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Total orders today
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

                <div className="rounded-lg border border-neutral-200 bg-white p-6 text-gray-900 shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <OrdersClient
                        data={orders}
                        branches={branches}
                        products={products}
                    />
                </div>
            </div>

            <Dialog
                open={Boolean(selectedStatus)}
                onOpenChange={(open) => !open && setSelectedStatus(null)}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCard?.title ?? 'Status'} Orders
                        </DialogTitle>
                        <DialogDescription>
                            Orders currently in{' '}
                            {selectedCard?.title.toLowerCase() ?? 'selected'}{' '}
                            status.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[340px] space-y-2 overflow-y-auto">
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
                                        {order.branch?.name ?? 'Unknown branch'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total: {formatAfn(order.total_amount)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
