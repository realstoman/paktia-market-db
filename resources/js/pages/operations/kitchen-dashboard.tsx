'use client';

import { brand } from '@/config/brand';
import { useLocalization } from '@/lib/localization';
import { router } from '@inertiajs/react';
import {
    BadgeCheck,
    ChefHat,
    Clock3,
    PackageCheck,
    Printer,
    ReceiptText,
    Truck,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumber } from '@/utils/format';

interface KitchenTicketItem {
    id: number;
    product_id: number;
    name?: string | null;
    pashto_name?: string | null;
    dari_name?: string | null;
    quantity: number;
    price: number;
    line_total: number;
    note?: string | null;
    prep_status: 'pending' | 'in_progress' | 'ready' | 'delivered';
    started_at?: string | null;
    ready_at?: string | null;
    delivered_at?: string | null;
    prepared_by?: string | null;
}

interface KitchenTicket {
    order_id: number;
    kitchen_id: number;
    kitchen_name?: string | null;
    order_type: string;
    order_status: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    delivery_address?: string | null;
    customer_note?: string | null;
    table_number?: string | null;
    server_name?: string | null;
    created_at?: string | null;
    elapsed_label?: string | null;
    ticket_status: 'pending' | 'in_progress' | 'ready' | 'delivered';
    items: KitchenTicketItem[];
}

interface KitchenDashboardProps {
    kitchenId: number | null;
    kitchenName?: string | null;
    kitchenQueue: KitchenTicket[];
    kitchenDailyReport: KitchenTicket[];
    kitchenSummary: {
        pending: number;
        inProgress: number;
        ready: number;
        deliveredToday: number;
    };
    reportDate: string;
}

function ticketTone(status: KitchenTicket['ticket_status']) {
    switch (status) {
        case 'ready':
            return 'border-amber-200 bg-amber-50';
        case 'in_progress':
            return 'border-sky-200 bg-sky-50';
        case 'delivered':
            return 'border-emerald-200 bg-emerald-50';
        default:
            return 'border-rose-200 bg-rose-50';
    }
}

export function KitchenDashboard({
    kitchenId,
    kitchenName,
    kitchenQueue,
    kitchenDailyReport,
    kitchenSummary,
    reportDate,
}: KitchenDashboardProps) {
    const { locale, t } = useLocalization();
    const previousQueueRef = useRef<number[]>([]);
    const isRtlLocale = locale === 'fa' || locale === 'ps';
    const kitchenLabel = t('orders.kitchenDashboard.kitchen', 'Kitchen');
    const unassignedKitchenLabel = t(
        'orders.kitchenDashboard.unassignedKitchen',
        'Unassigned kitchen',
    );

    const statusLabel = (status: KitchenTicket['ticket_status']) => {
        switch (status) {
            case 'in_progress':
                return t('orders.kitchenDashboard.status.preparing', 'Preparing');
            case 'ready':
                return t('orders.kitchenDashboard.status.ready', 'Ready');
            case 'delivered':
                return t('orders.kitchenDashboard.status.delivered', 'Delivered');
            default:
                return t('orders.kitchenDashboard.status.new', 'New');
        }
    };

    const itemStatusLabel = (status: KitchenTicketItem['prep_status']) => {
        switch (status) {
            case 'in_progress':
                return t('orders.kitchenDashboard.status.preparing', 'Preparing');
            case 'ready':
                return t('orders.kitchenDashboard.status.ready', 'Ready');
            case 'delivered':
                return t('orders.kitchenDashboard.status.delivered', 'Delivered');
            default:
                return t('dashboard.pending', 'Pending');
        }
    };

    const groupedQueue = useMemo(
        () => ({
            pending: kitchenQueue.filter((ticket) => ticket.ticket_status === 'pending'),
            inProgress: kitchenQueue.filter((ticket) => ticket.ticket_status === 'in_progress'),
            ready: kitchenQueue.filter((ticket) => ticket.ticket_status === 'ready'),
        }),
        [kitchenQueue],
    );

    useEffect(() => {
        const interval = window.setInterval(() => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
                only: [
                    'mode',
                    'branchId',
                    'kitchenId',
                    'kitchenName',
                    'kitchenQueue',
                    'kitchenDailyReport',
                    'kitchenSummary',
                    'reportDate',
                ],
            });
        }, 10000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const currentPendingIds = groupedQueue.pending.map((ticket) => ticket.order_id);
        const previousIds = previousQueueRef.current;

        if (previousIds.length > 0) {
            const hasNewTicket = currentPendingIds.some((id) => !previousIds.includes(id));

            if (hasNewTicket) {
                toast.success(
                    t(
                        'orders.kitchenDashboard.messages.newTicketReceived',
                        'New kitchen ticket received.',
                    ),
                );
            }
        }

        previousQueueRef.current = currentPendingIds;
    }, [groupedQueue.pending, t]);

    const resolveItemName = (item: KitchenTicketItem) => {
        if (locale === 'ps') {
            return item.pashto_name?.trim() || item.dari_name?.trim() || item.name || '';
        }

        if (locale === 'fa') {
            return item.dari_name?.trim() || item.pashto_name?.trim() || item.name || '';
        }

        return item.name || '';
    };

    const mutateItem = (itemId: number, action: 'start' | 'ready' | 'delivered') => {
        router.post(`/kitchen/order-items/${itemId}/${action}`, undefined, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const printTicket = (ticket: KitchenTicket) => {
        const logoSrc = brand.logoFull || brand.logo;
        const printWindow = window.open('', '_blank', 'width=420,height=720');

        if (!printWindow) {
            toast.error(
                t(
                    'orders.kitchenDashboard.messages.printWindowBlocked',
                    'Unable to open print window.',
                ),
            );
            return;
        }

        const rows = ticket.items
            .map(
                (item) => `
                    <tr>
                        ${
                            isRtlLocale
                                ? `
                        <td style="padding: 6px 0; text-align: ${qtyAlign};">${formatNumber(item.quantity)}x</td>
                        <td style="padding: 6px 0; text-align: ${textAlign};">${resolveItemName(item)}</td>
                        `
                                : `
                        <td style="padding: 6px 0; text-align: ${textAlign};">${resolveItemName(item)}</td>
                        <td style="padding: 6px 0; text-align: ${qtyAlign};">x${formatNumber(item.quantity)}</td>
                        `
                        }
                    </tr>
                    ${item.note ? `<tr><td colspan="2" style="padding: 0 0 6px; font-size: 11px; color: #555; text-align: ${textAlign};">${t('orders.kitchenDashboard.note', 'Note')}: ${item.note}</td></tr>` : ''}
                `,
            )
            .join('');

        const orderTypeLabel = t(
            `dashboard.${ticket.order_type === 'dine_in' ? 'dineIn' : ticket.order_type}`,
            ticket.order_type.replace('_', ' '),
        );
        const tableLabel = t('orders.form.tableNumber', 'Table Number');
        const orderLabel = t('orders.receipt.order', 'Order');
        const preparedLabel = t('orders.kitchenDashboard.preparedAt', 'Prepared');
        const completedAndDeliveredLabel = t(
            'orders.kitchenDashboard.completedAndDelivered',
            'Completed and delivered',
        );
        const kitchenPrintTitle = t(
            'orders.kitchenDashboard.print.ticketTitle',
            'Kitchen Ticket',
        );
        const textAlign = isRtlLocale ? 'right' : 'left';
        const rowDirection = isRtlLocale ? 'rtl' : 'ltr';
        const qtyAlign = isRtlLocale ? 'left' : 'center';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${kitchenPrintTitle} #${ticket.order_id}</title>
                    <style>
                        body { font-family: Manrope, sans-serif; margin: 0; padding: 12px; color: #111; direction: ${rowDirection}; text-align: ${textAlign}; }
                        .wrap { width: 72mm; margin: 0 auto; }
                        .center { text-align: center; }
                        .muted { color: #666; font-size: 12px; }
                        .divider { border-top: 1px dashed #999; margin: 10px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        h2, h3, p { margin: 0; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="wrap">
                        <div class="center">
                            <img src="${logoSrc}" alt="${brand.name}" style="max-width: 160px; max-height: 60px; object-fit: contain;" />
                            <h3 style="margin-top: 8px;">${kitchenName ?? ticket.kitchen_name ?? kitchenLabel}</h3>
                            <p class="muted">${orderLabel} #${ticket.order_id}</p>
                            <p class="muted">${orderTypeLabel}${ticket.table_number ? ` • ${tableLabel} ${ticket.table_number}` : ''}</p>
                        </div>
                        <div class="divider"></div>
                        <table>${rows}</table>
                        <div class="divider"></div>
                        <p class="muted">${preparedLabel}: ${new Date().toLocaleString('en-US')}</p>
                        <p class="muted">${t('dashboard.status', 'Status')}: ${completedAndDeliveredLabel}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const printDailyReport = () => {
        const printWindow = window.open('', '_blank', 'width=420,height=720');

        if (!printWindow) {
            toast.error(
                t(
                    'orders.kitchenDashboard.messages.printWindowBlocked',
                    'Unable to open print window.',
                ),
            );
            return;
        }

        const orderLabel = t('orders.receipt.order', 'Order');
        const dateLabel = t('orders.receipt.date', 'Date');
        const completedTicketsLabel = t(
            'orders.kitchenDashboard.completedTickets',
            'Completed tickets',
        );
        const noCompletedForDateLabel = t(
            'orders.kitchenDashboard.empty.dailyReport',
            'No completed kitchen tickets for this date.',
        );
        const dailyReportTitle = t(
            'orders.kitchenDashboard.dailyReportTitle',
            'Daily Kitchen Report',
        );
        const tableLabel = t('orders.form.tableNumber', 'Table Number');
        const logoSrc = brand.logoFull || brand.logo;
        const kitchenReportTitle = `${kitchenName ?? kitchenLabel} ${dailyReportTitle}`;
        const textAlign = isRtlLocale ? 'right' : 'left';
        const rowDirection = isRtlLocale ? 'rtl' : 'ltr';
        const rowJustify = isRtlLocale ? 'row-reverse' : 'row';

        const ticketsHtml = kitchenDailyReport
            .map(
                (ticket) => `
                    <section style="margin-bottom: 12px;">
                        <h3 style="margin: 0 0 4px; font-size: 14px;">${orderLabel} #${ticket.order_id}</h3>
                        <p style="margin: 0 0 6px; color: #666; font-size: 11px;">
                            ${t(`dashboard.${ticket.order_type === 'dine_in' ? 'dineIn' : ticket.order_type}`, ticket.order_type.replace('_', ' '))}${ticket.table_number ? ` • ${tableLabel} ${ticket.table_number}` : ''}${ticket.customer_name ? ` • ${ticket.customer_name}` : ''}
                        </p>
                        <div style="display: grid; gap: 4px;">
                            ${ticket.items
                                .map(
                                    (item) => `
                                        <div style="display: flex; flex-direction: ${rowJustify}; justify-content: space-between; gap: 8px; font-size: 12px; text-align: ${textAlign};">
                                            ${
                                                isRtlLocale
                                                    ? `<span>${formatNumber(item.quantity)}x</span><span>${resolveItemName(item)}</span>`
                                                    : `<span>${resolveItemName(item)}</span><span>x${formatNumber(item.quantity)}</span>`
                                            }
                                        </div>
                                    `,
                                )
                                .join('')}
                        </div>
                        <div style="border-top: 1px dashed #999; margin-top: 10px;"></div>
                    </section>
                `,
            )
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>${kitchenReportTitle}</title>
                    <style>
                        body { font-family: Manrope, sans-serif; margin: 0; padding: 12px; color: #111; direction: ${rowDirection}; text-align: ${textAlign}; }
                        .wrap { width: 72mm; margin: 0 auto; }
                        .center { text-align: center; }
                        .muted { color: #666; font-size: 12px; }
                        .divider { border-top: 1px dashed #999; margin: 10px 0; }
                        h1, h2, h3, p { margin: 0; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="wrap">
                        <div class="center">
                            <img src="${logoSrc}" alt="${brand.name}" style="max-width: 160px; max-height: 60px; object-fit: contain;" />
                            <h3 style="margin-top: 8px;">${kitchenReportTitle}</h3>
                            <p class="muted">${dateLabel}: ${reportDate}</p>
                            <p class="muted">${completedTicketsLabel}: ${formatNumber(kitchenDailyReport.length)}</p>
                        </div>
                        <div class="divider"></div>
                        ${ticketsHtml || `<p class="muted">${noCompletedForDateLabel}</p>`}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-neutral-200/70 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            {kitchenLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <ChefHat className="h-5 w-5 text-[#b5542a]" />
                            <p className="text-lg font-semibold">
                                {kitchenName ?? unassignedKitchenLabel}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200/70 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            {t(
                                'orders.kitchenDashboard.newTickets',
                                'New Tickets',
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{formatNumber(kitchenSummary.pending)}</CardContent>
                </Card>
                <Card className="border-neutral-200/70 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            {t(
                                'orders.kitchenDashboard.status.preparing',
                                'Preparing',
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{formatNumber(kitchenSummary.inProgress)}</CardContent>
                </Card>
                <Card className="border-neutral-200/70 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            {t(
                                'orders.kitchenDashboard.deliveredToday',
                                'Delivered Today',
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{formatNumber(kitchenSummary.deliveredToday)}</CardContent>
                </Card>
            </div>

            {!kitchenId ? (
                <Card className="border-neutral-200/70 shadow-none">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        {t(
                            'orders.kitchenDashboard.unassignedDescription',
                            'This kitchen account is not assigned to a kitchen yet. Assign a kitchen from the users section to start receiving tickets.',
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(360px,0.9fr)]">
                        <div className="grid gap-4 lg:grid-cols-3">
                            {[
                                {
                                    key: 'pending',
                                    title: t(
                                        'orders.kitchenDashboard.status.new',
                                        'New',
                                    ),
                                    tickets: groupedQueue.pending,
                                },
                                {
                                    key: 'in-progress',
                                    title: t(
                                        'orders.kitchenDashboard.status.preparing',
                                        'Preparing',
                                    ),
                                    tickets: groupedQueue.inProgress,
                                },
                                {
                                    key: 'ready',
                                    title: t(
                                        'orders.kitchenDashboard.status.ready',
                                        'Ready',
                                    ),
                                    tickets: groupedQueue.ready,
                                },
                            ].map((column) => (
                                <Card key={column.key} className="min-h-[720px] border-neutral-200/70 shadow-none">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-base">
                                            <span>{column.title}</span>
                                            <span className="text-sm text-muted-foreground">{formatNumber(column.tickets.length)}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="min-h-0 px-4 pb-4">
                                        <ScrollArea className="h-[620px] pr-3">
                                            <div className="space-y-3">
                                                {column.tickets.map((ticket) => (
                                                    <div
                                                        key={`${ticket.order_id}-${ticket.ticket_status}`}
                                                        className={`rounded-2xl border p-4 ${ticketTone(ticket.ticket_status)}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-base font-semibold">
                                                                    {t(
                                                                        'orders.receipt.order',
                                                                        'Order',
                                                                    )}{' '}
                                                                    #{ticket.order_id}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t(
                                                                        `dashboard.${ticket.order_type === 'dine_in' ? 'dineIn' : ticket.order_type}`,
                                                                        ticket.order_type.replace(
                                                                            '_',
                                                                            ' ',
                                                                        ),
                                                                    )}
                                                                    {ticket.table_number
                                                                        ? ` • ${t('orders.form.tableNumber', 'Table Number')} ${ticket.table_number}`
                                                                        : ''}
                                                                </p>
                                                            </div>
                                                            <span className="rounded-full border bg-white/80 px-2.5 py-1 text-xs font-medium">
                                                                {statusLabel(ticket.ticket_status)}
                                                            </span>
                                                        </div>

                                                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Clock3 className="h-3.5 w-3.5" />
                                                                {ticket.elapsed_label ??
                                                                    t(
                                                                        'orders.kitchenDashboard.now',
                                                                        'now',
                                                                    )}
                                                            </span>
                                                            {ticket.server_name ? (
                                                                <span>
                                                                    {t(
                                                                        'orders.kitchenDashboard.by',
                                                                        'By',
                                                                    )}{' '}
                                                                    {ticket.server_name}
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <div className="mt-3 space-y-2">
                                                            {ticket.items.map((item) => (
                                                                <div key={item.id} className="rounded-xl bg-white/80 p-3">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div>
                                                                            <p className="font-medium">{resolveItemName(item)}</p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {formatNumber(item.quantity)} x {formatNumber(item.price)} AFN
                                                                            </p>
                                                                            {item.note ? (
                                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                                    {t(
                                                                                        'orders.kitchenDashboard.note',
                                                                                        'Note',
                                                                                    )}
                                                                                    : {item.note}
                                                                                </p>
                                                                            ) : null}
                                                                        </div>
                                                                        <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                                                                            {itemStatusLabel(
                                                                                item.prep_status,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        {item.prep_status === 'pending' ? (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => mutateItem(item.id, 'start')}
                                                                            >
                                                                                <ChefHat className="mr-2 h-4 w-4" />
                                                                                {t(
                                                                                    'orders.kitchenDashboard.actions.start',
                                                                                    'Start',
                                                                                )}
                                                                            </Button>
                                                                        ) : null}
                                                                        {item.prep_status !== 'ready' && item.prep_status !== 'delivered' ? (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => mutateItem(item.id, 'ready')}
                                                                            >
                                                                                <PackageCheck className="mr-2 h-4 w-4" />
                                                                                {t(
                                                                                    'orders.kitchenDashboard.actions.markReady',
                                                                                    'Mark Ready',
                                                                                )}
                                                                            </Button>
                                                                        ) : null}
                                                                        {item.prep_status === 'ready' ? (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => mutateItem(item.id, 'delivered')}
                                                                            >
                                                                                <Truck className="mr-2 h-4 w-4" />
                                                                                {t(
                                                                                    'orders.kitchenDashboard.actions.markDelivered',
                                                                                    'Mark Delivered',
                                                                                )}
                                                                            </Button>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => printTicket(ticket)}
                                                            >
                                                                <Printer className="mr-2 h-4 w-4" />
                                                                {t(
                                                                    'orders.kitchenDashboard.actions.printChit',
                                                                    'Print Chit',
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {column.tickets.length === 0 ? (
                                                    <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                                        {t(
                                                            'orders.kitchenDashboard.empty.column',
                                                            'No tickets in this column right now.',
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="min-h-[720px] border-neutral-200/70 shadow-none">
                            <CardHeader className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="text-base">
                                        {t(
                                            'orders.kitchenDashboard.dailyReportTitle',
                                            'Daily Kitchen Report',
                                        )}
                                    </CardTitle>
                                    <Button variant="outline" onClick={printDailyReport}>
                                        <ReceiptText className="mr-2 h-4 w-4" />
                                        {t(
                                            'orders.kitchenDashboard.actions.printReport',
                                            'Print Report',
                                        )}
                                    </Button>
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="kitchen-report-date" className="text-sm text-muted-foreground">
                                        {t(
                                            'orders.kitchenDashboard.reportDate',
                                            'Report Date',
                                        )}
                                    </label>
                                    <Input
                                        id="kitchen-report-date"
                                        type="date"
                                        value={reportDate}
                                        onChange={(event) =>
                                            router.get(
                                                '/dashboard',
                                                { report_date: event.target.value },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    replace: true,
                                                    only: [
                                                        'mode',
                                                        'branchId',
                                                        'kitchenId',
                                                        'kitchenName',
                                                        'kitchenQueue',
                                                        'kitchenDailyReport',
                                                        'kitchenSummary',
                                                        'reportDate',
                                                    ],
                                                },
                                            )
                                        }
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <ScrollArea className="h-[590px] pr-3">
                                    <div className="space-y-3">
                                        {kitchenDailyReport.map((ticket) => (
                                            <div key={`report-${ticket.order_id}`} className="rounded-2xl border border-neutral-200 bg-white p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold">
                                                            {t(
                                                                'orders.receipt.order',
                                                                'Order',
                                                            )}{' '}
                                                            #{ticket.order_id}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t(
                                                                `dashboard.${ticket.order_type === 'dine_in' ? 'dineIn' : ticket.order_type}`,
                                                                ticket.order_type.replace(
                                                                    '_',
                                                                    ' ',
                                                                ),
                                                            )}
                                                            {ticket.table_number
                                                                ? ` • ${t('orders.form.tableNumber', 'Table Number')} ${ticket.table_number}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
                                                        <BadgeCheck className="h-3.5 w-3.5" />
                                                        {t(
                                                            'dashboard.completed',
                                                            'Completed',
                                                        )}
                                                    </span>
                                                </div>
                                                <ul className="mt-3 space-y-1 text-sm">
                                                    {ticket.items.map((item) => (
                                                        <li key={item.id}>
                                                            {resolveItemName(item)} x{formatNumber(item.quantity)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}

                                        {kitchenDailyReport.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'orders.kitchenDashboard.empty.dailyReport',
                                                    'No completed kitchen tickets found for this date.',
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
