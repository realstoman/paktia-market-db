'use client';

import { brand } from '@/config/brand';
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
import {
    Branch,
    BranchTable,
    BreadcrumbItem,
    Order,
    Product,
    SharedData,
} from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleX,
    Clock3,
    CookingPot,
    FilterX,
    CalendarIcon,
    Download,
    type LucideIcon,
    PackageCheck,
    Printer,
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
    const { auth } = usePage<SharedData>().props;
    const isOrderTaker = auth.roles.includes('order-taker');
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
    const reportLabel = useMemo(() => {
        if (isAllTime) {
            return t('orders.allTimeRecords', 'All time records for orders');
        }

        return todayDate || t('orders.totalOrdersToday', 'Total orders today');
    }, [isAllTime, t, todayDate]);

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
    const getOrderTypeLabel = (orderType: string) =>
        t(`orders.orderType.${orderType}`, orderType.replace('_', ' '));
    const userPerformance = useMemo(() => {
        const rows = new Map<
            string,
            {
                total: number;
                completed: number;
                cancelled: number;
                revenue: number;
                payments: number;
            }
        >();

        for (const order of orders) {
            const userName =
                order.user?.name ??
                t('orders.unassignedUser', 'Unassigned user');
            const current = rows.get(userName) ?? {
                total: 0,
                completed: 0,
                cancelled: 0,
                revenue: 0,
                payments: 0,
            };

            current.total += 1;
            if ((order.status ?? 'pending') === 'completed') {
                current.completed += 1;
                current.revenue += Number(order.total_amount ?? 0) || 0;
            }
            if ((order.status ?? 'pending') === 'cancelled') {
                current.cancelled += 1;
            }
            current.payments += (order.payments ?? []).reduce(
                (sum, payment) => sum + (Number(payment.amount ?? 0) || 0),
                0,
            );

            rows.set(userName, current);
        }

        return Array.from(rows.entries())
            .map(([userName, data]) => ({
                userName,
                ...data,
            }))
            .sort((a, b) => b.completed - a.completed || b.total - a.total);
    }, [orders, t]);
    const totalCollected = useMemo(
        () =>
            orders.reduce(
                (sum, order) =>
                    sum +
                    (order.payments ?? []).reduce(
                        (paymentSum, payment) =>
                            paymentSum + (Number(payment.amount ?? 0) || 0),
                        0,
                    ),
                0,
            ),
        [orders],
    );
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

    const escapeCsv = (value: string | number) => {
        const normalized = String(value ?? '');
        return `"${normalized.replaceAll('"', '""')}"`;
    };

    const handleDownloadReport = () => {
        const summaryRows = [
            ['Report', reportLabel],
            ['Generated by', auth.user.name],
            ['Total orders', orders.length],
            ['Completed', stats.completed],
            ['Cancelled', stats.cancelled],
            ['Ready', stats.ready],
            ['Preparing', stats.in_progress],
            ['Pending', stats.pending],
            ['Collected payments', totalCollected],
        ];

        const userRows = userPerformance.map((row) => [
            row.userName,
            row.total,
            row.completed,
            row.cancelled,
            row.revenue,
            row.payments,
        ]);

        const orderRows = orders.map((order) => [
            order.id,
            order.created_at
                ? new Date(order.created_at).toLocaleString(dateLocale)
                : '-',
            order.user?.name ?? 'Unassigned',
            getOrderTypeLabel(order.order_type),
            getStatusLabel((order.status ?? 'pending') as OrderStatusKey),
            order.items_count ?? order.items?.length ?? 0,
            Number(order.sub_total_amount ?? order.total_amount ?? 0) || 0,
            Number(order.discount_amount ?? 0) || 0,
            Number(order.total_amount ?? 0) || 0,
            Number(order.paid_amount ?? 0) || 0,
            (order.payments ?? [])
                .map((payment) => payment.method ?? 'cash')
                .join(', '),
            (order.payments ?? [])
                .map((payment) => Number(payment.amount ?? 0) || 0)
                .join(', '),
        ]);

        const csvLines = [
            'End of Day Orders Report',
            ...summaryRows.map((row) => row.map(escapeCsv).join(',')),
            '',
            ['User', 'Total Orders', 'Completed', 'Cancelled', 'Revenue', 'Payments']
                .map(escapeCsv)
                .join(','),
            ...userRows.map((row) => row.map(escapeCsv).join(',')),
            '',
            [
                'Order #',
                'Created At',
                'Handled By',
                'Type',
                'Status',
                'Items',
                'Subtotal',
                'Discount',
                'Total',
                'Paid',
                'Payment Methods',
                'Payment Amounts',
            ]
                .map(escapeCsv)
                .join(','),
            ...orderRows.map((row) => row.map(escapeCsv).join(',')),
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvLines}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orders-report-${selectedDate ?? 'all-time'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank', 'width=1200,height=900');
        if (!printWindow) {
            return;
        }

        const userRows = userPerformance
            .map(
                (row) => `
                    <tr>
                        <td>${row.userName}</td>
                        <td>${formatNumber(row.total)}</td>
                        <td>${formatNumber(row.completed)}</td>
                        <td>${formatNumber(row.cancelled)}</td>
                        <td>${formatAfn(row.revenue)}</td>
                        <td>${formatAfn(row.payments)}</td>
                    </tr>
                `,
            )
            .join('');

        const orderRows = orders
            .map((order) => {
                const paymentMethods =
                    (order.payments ?? [])
                        .map((payment) => payment.method ?? 'cash')
                        .join(', ') || '-';
                const paymentAmounts =
                    (order.payments ?? [])
                        .map((payment) => formatAfn(payment.amount ?? 0))
                        .join(', ') || '-';

                return `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${order.created_at ? new Date(order.created_at).toLocaleString(dateLocale) : '-'}</td>
                        <td>${order.user?.name ?? 'Unassigned'}</td>
                        <td>${getOrderTypeLabel(order.order_type)}</td>
                        <td>${getStatusLabel((order.status ?? 'pending') as OrderStatusKey)}</td>
                        <td>${formatNumber(order.items_count ?? order.items?.length ?? 0)}</td>
                        <td>${formatAfn(order.sub_total_amount ?? order.total_amount ?? 0)}</td>
                        <td>${formatAfn(order.discount_amount ?? 0)}</td>
                        <td>${formatAfn(order.total_amount ?? 0)}</td>
                        <td>${formatAfn(order.paid_amount ?? 0)}</td>
                        <td>${paymentMethods}</td>
                        <td>${paymentAmounts}</td>
                    </tr>
                `;
            })
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Orders Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
                        h1, h2 { margin: 0 0 8px; }
                        p { margin: 4px 0; }
                        .meta, .summary { margin-bottom: 24px; }
                        .meta { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
                        .meta-copy { flex:1; }
                        .meta-logo { width:72px; height:72px; object-fit:contain; }
                        .summary-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; margin-top:12px; }
                        .summary-card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; }
                        table { width:100%; border-collapse: collapse; margin-top: 12px; }
                        th, td { border:1px solid #e5e7eb; padding:8px; text-align:left; font-size:12px; vertical-align:top; }
                        th { background:#f9fafb; }
                        .section { margin-top: 28px; }
                        @media print { body { margin: 12px; } }
                    </style>
                </head>
                <body>
                    <div class="meta">
                        <div class="meta-copy">
                            <h1>Orders Report</h1>
                            <p><strong>Date:</strong> ${reportLabel}</p>
                            <p><strong>Generated by:</strong> ${auth.user.name}</p>
                        </div>
                        <img
                            src="${
                                brand.logoFull.startsWith('http')
                                    ? brand.logoFull
                                    : `${window.location.origin}${brand.logoFull}`
                            }"
                            alt="Baba Restaurant Logo"
                            class="meta-logo"
                        />
                    </div>

                    <div class="summary">
                        <h2>Summary</h2>
                        <div class="summary-grid">
                            <div class="summary-card"><strong>Total Orders</strong><p>${formatNumber(orders.length)}</p></div>
                            <div class="summary-card"><strong>Completed</strong><p>${formatNumber(stats.completed)}</p></div>
                            <div class="summary-card"><strong>Cancelled</strong><p>${formatNumber(stats.cancelled)}</p></div>
                            <div class="summary-card"><strong>Ready</strong><p>${formatNumber(stats.ready)}</p></div>
                            <div class="summary-card"><strong>Preparing</strong><p>${formatNumber(stats.in_progress)}</p></div>
                            <div class="summary-card"><strong>Collected Payments</strong><p>${formatAfn(totalCollected)}</p></div>
                        </div>
                    </div>

                    <div class="section">
                        <h2>User Performance</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Total Orders</th>
                                    <th>Completed</th>
                                    <th>Cancelled</th>
                                    <th>Revenue</th>
                                    <th>Payments</th>
                                </tr>
                            </thead>
                            <tbody>${userRows}</tbody>
                        </table>
                    </div>

                    <div class="section">
                        <h2>Orders List</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Created At</th>
                                    <th>Handled By</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Items</th>
                                    <th>Subtotal</th>
                                    <th>Discount</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Payment Methods</th>
                                    <th>Payment Amounts</th>
                                </tr>
                            </thead>
                            <tbody>${orderRows}</tbody>
                        </table>
                    </div>
                    <script>
                        window.onload = function () {
                            window.print();
                            window.onafterprint = function () { window.close(); };
                        };
                    </script>
                </body>
            </html>
        `);

        printWindow.document.close();
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            defaultSidebarOpen={isOrderTaker ? false : undefined}
        >
            <Head title={t('orders.title', 'Orders')} />
            <div className="space-y-3 py-2">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={handlePrintReport}
                            disabled={orders.length === 0}
                        >
                            <Printer className="h-4 w-4" />
                            {t('orders.printReport', 'Print report')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={handleDownloadReport}
                            disabled={orders.length === 0}
                        >
                            <Download className="h-4 w-4" />
                            {t('orders.downloadReport', 'Download CSV')}
                        </Button>
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
