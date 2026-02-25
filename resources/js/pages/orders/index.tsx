'use client';

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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Order, Product } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleX,
    Clock3,
    ExternalLink,
    LoaderCircle,
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
    { key: 'in_progress', title: 'In Progress', icon: LoaderCircle },
    { key: 'pending', title: 'Pending', icon: Clock3 },
    { key: 'completed', title: 'Completed', icon: CheckCircle2 },
    { key: 'cancelled', title: 'Cancelled', icon: CircleX },
];

export default function OrdersPage({
    orders,
    branches,
    products,
}: OrdersPageProps) {
    const [selectedStatus, setSelectedStatus] = useState<OrderStatusKey | null>(
        null,
    );

    const todayDate = useMemo(
        () =>
            new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
        [],
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="space-y-6 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card className="gap-3 py-4">
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

                        {topRowStatusCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <Card key={card.key} className="gap-3 py-4">
                                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                                        <CardTitle className="text-sm">
                                            {card.title}
                                        </CardTitle>
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="flex items-end justify-between gap-3">
                                        <p className="text-2xl font-semibold tracking-tight">
                                            {formatNumber(stats[card.key])}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                setSelectedStatus(card.key)
                                            }
                                        >
                                            Details
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {bottomRowStatusCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <Card key={card.key} className="gap-3 py-4">
                                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                                        <CardTitle className="text-sm">
                                            {card.title}
                                        </CardTitle>
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="flex items-end justify-between gap-3">
                                        <p className="text-2xl font-semibold tracking-tight">
                                            {formatNumber(stats[card.key])}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                setSelectedStatus(card.key)
                                            }
                                        >
                                            Details
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 text-gray-900">
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
