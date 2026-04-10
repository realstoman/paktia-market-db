'use client';

import InputError from '@/components/input-error';
import { OrderStatusStatCard } from '@/components/shared/order-status-stat-card';
import { OrdersClient } from '@/components/tables/orders/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Branch, BranchTable, BreadcrumbItem, Order, Product } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleX,
    Clock3,
    CookingPot,
    FilterX,
    CalendarIcon,
    type LucideIcon,
    PackageCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    icon: LucideIcon;
}

const STATUS_CARDS: StatusCardConfig[] = [
    { key: 'ready', icon: PackageCheck },
    { key: 'completed', icon: CheckCircle2 },
    { key: 'in_progress', icon: CookingPot },
    { key: 'pending', icon: Clock3 },
    { key: 'cancelled', icon: CircleX },
];

function toDateParam(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function OrdersPage({
    orders,
    branches,
    products,
    branchTables,
    selectedDate,
    isAllTime,
    restaurantStartDate,
}: OrdersPageProps) {
    const { t, locale, isRtl } = useLocalization();
    const dateLocale = useMemo(() => {
        if (locale === 'fa') {
            return 'fa-AF';
        }

        if (locale === 'ps') {
            return 'ps-AF';
        }

        return 'en-US';
    }, [locale]);
    const [selectedStatus, setSelectedStatus] = useState<OrderStatusKey | null>(
        null,
    );
    const [dateFilter, setDateFilter] = useState(selectedDate ?? '');
    const [dateError, setDateError] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const todayDate = useMemo(
        () =>
            selectedDate
                ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                      dateLocale,
                      {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                      },
                  )
                : '',
        [dateLocale, selectedDate],
    );

    const restaurantStartedDate = useMemo(
        () =>
            restaurantStartDate
                ? new Date(restaurantStartDate).toLocaleDateString(dateLocale, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                  })
                : null,
        [dateLocale, restaurantStartDate],
    );
    const selectedAfghanDate = useMemo(
        () =>
            dateFilter
                ? new Date(`${dateFilter}T00:00:00`).toLocaleDateString(
                      dateLocale,
                      {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                      },
                  )
                : '',
        [dateLocale, dateFilter],
    );
    const selectedDateValue = useMemo(
        () => (dateFilter ? new Date(`${dateFilter}T00:00:00`) : undefined),
        [dateFilter],
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
    const getStatusLabel = (status: OrderStatusKey) =>
        t(`orders.status.${status}`, status);
    const selectedOrders = orders.filter(
        (order) => (order.status ?? 'pending') === selectedStatus,
    );
    const topRowStatusCards = STATUS_CARDS.slice(0, 2);
    const bottomRowStatusCards = STATUS_CARDS.slice(2);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard', 'Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('orders.breadcrumb', 'Orders'),
            href: '/orders',
        },
    ];

    const handleDateSubmit = () => {
        if (!dateFilter) {
            setDateError(t('orders.selectDateError', 'Please select a date.'));
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
            <Head title={t('orders.title', 'Orders')} />
            <div className="space-y-3 py-2">
                <div className="flex justify-end">
                    <div className="w-full max-w-md space-y-1">
                        <div className="flex items-end justify-end gap-2">
                            <div className="w-full bg-white dark:bg-neutral-900">
                                <InputGroup className="h-10">
                                    <InputGroupInput
                                        value={selectedAfghanDate}
                                        readOnly
                                        placeholder={t(
                                            'dashboard.selectDate',
                                            'Select date',
                                        )}
                                        className={isRtl ? 'text-right' : ''}
                                        onClick={() =>
                                            setIsDatePickerOpen(true)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'ArrowDown') {
                                                event.preventDefault();
                                                setIsDatePickerOpen(true);
                                            }
                                        }}
                                    />
                                    <InputGroupAddon
                                        align={isRtl ? 'inline-start' : 'inline-end'}
                                    >
                                        <Popover
                                            open={isDatePickerOpen}
                                            onOpenChange={setIsDatePickerOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <InputGroupButton
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    aria-label={t(
                                                        'dashboard.selectDate',
                                                        'Select date',
                                                    )}
                                                >
                                                    <CalendarIcon />
                                                    <span className="sr-only">
                                                        {t(
                                                            'dashboard.selectDate',
                                                            'Select date',
                                                        )}
                                                    </span>
                                                </InputGroupButton>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto overflow-hidden p-0"
                                                align={isRtl ? 'start' : 'end'}
                                                alignOffset={-8}
                                                sideOffset={10}
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDateValue}
                                                    month={selectedDateValue}
                                                    onSelect={(date) => {
                                                        if (!date) {
                                                            return;
                                                        }

                                                        setDateFilter(
                                                            toDateParam(date),
                                                        );
                                                        setDateError('');
                                                        setIsDatePickerOpen(
                                                            false,
                                                        );
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </InputGroupAddon>
                                </InputGroup>
                            </div>
                            <Button
                                type="button"
                                className="h-10 shrink-0"
                                onClick={handleDateSubmit}
                            >
                                {t('orders.submit', 'Submit')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 shrink-0 gap-1.5"
                                onClick={handleClearFilter}
                            >
                                <FilterX className="h-4 w-4" />
                                {t('orders.clear', 'Clear')}
                            </Button>
                        </div>
                        {selectedAfghanDate && locale !== 'en' ? (
                            <p
                                className={`text-xs text-muted-foreground ${
                                    isRtl ? 'text-right' : ''
                                }`}
                            >
                                {t('orders.afghanDateLabel', 'Afghan date')}:{' '}
                                {selectedAfghanDate}
                            </p>
                        ) : null}
                        <InputError message={dateError} />
                    </div>
                </div>

                <section>
                    <div className="grid grid-cols-1 gap-3 pt-0 md:grid-cols-12">
                        <Card className="gap-3 overflow-hidden border-neutral-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f5f8f8_52%,rgba(16,47,51,0.16)_100%)] pt-4 pb-0 shadow-none md:col-span-4 md:row-span-2 dark:border-white/10 dark:bg-neutral-900">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-xl text-neutral-900 dark:text-white">
                                    {t(
                                        'brand.restaurantName',
                                        'Baba Restaurant',
                                    )}
                                </CardTitle>
                                <CardDescription className="text-sm text-neutral-600 dark:text-neutral-300">
                                    {isAllTime
                                        ? t(
                                              'orders.allTimeRecords',
                                              'All time records for orders',
                                          )
                                        : `${t('orders.statisticsFor', 'Order statistics for')} ${todayDate}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-white">
                                    {formatNumber(orders.length)}
                                </p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                    {isAllTime
                                        ? `${t('orders.allTimeSince', 'All time since')} ${restaurantStartedDate ?? '-'}`
                                        : t(
                                              'orders.totalOrdersToday',
                                              'Total orders today',
                                          )}
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-3 md:col-span-8 md:grid-cols-12">
                            {topRowStatusCards.map((card) => {
                                return (
                                    <OrderStatusStatCard
                                        key={card.key}
                                        title={getStatusLabel(card.key)}
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
                                        title={getStatusLabel(card.key)}
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
                direction={isRtl ? 'right' : 'left'}
            >
                <DrawerContent className="h-screen w-full p-0 data-[vaul-drawer-direction=right]:sm:max-w-xl">
                    <DrawerHeader className="sticky top-0 z-10 border-b bg-background">
                        <DrawerTitle>
                            {selectedCard
                                ? `${getStatusLabel(selectedCard.key)} ${t('orders.statusOrders', 'Orders')}`
                                : `${t('orders.title', 'Orders')}`}
                        </DrawerTitle>
                        <DrawerDescription>
                            {t(
                                'orders.statusOrdersDescription',
                                'Orders currently in',
                            )}{' '}
                            {selectedCard
                                ? getStatusLabel(selectedCard.key)
                                : t('orders.details', 'Details')}{' '}
                            {t(
                                'orders.statusOrdersDescriptionSuffix',
                                'status.',
                            )}
                        </DrawerDescription>
                    </DrawerHeader>

                    <ScrollArea className="h-[calc(100vh-88px)] px-4 pb-4">
                        <div className="space-y-2 py-4">
                            {selectedOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'orders.noOrdersForStatus',
                                        'No orders found for this status.',
                                    )}
                                </p>
                            ) : (
                                selectedOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="rounded-md border border-neutral-200/70 p-3 dark:border-neutral-800"
                                    >
                                        <p className="font-medium">
                                            {t(
                                                'orders.detailsModal.titlePrefix',
                                                'Order #',
                                            )}
                                            {order.id}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'orders.detailsModal.branch',
                                                'Branch',
                                            )}
                                            :{' '}
                                            {order.branch?.name ??
                                                t(
                                                    'orders.unknownBranch',
                                                    'Unknown branch',
                                                )}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'orders.detailsModal.total',
                                                'Total',
                                            )}
                                            : {formatAfn(order.total_amount)}
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
