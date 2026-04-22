import { NumericInput } from '@/components/shared/numeric-input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { brand } from '@/config/brand';
import { useLocalization } from '@/lib/localization';
import { DiscountCard, Order } from '@/types';
import { formatAfn } from '@/utils/format';
import { IconMapPin } from '@tabler/icons-react';
import { Printer, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ReceiptPreviewDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paymentMethod?: string;
    onPaymentMethodChange?: (value: string) => void;
    discountCards?: DiscountCard[];
    onCompletePayment?: (
        order: Order,
        payload: {
            discountAmount: number;
            paymentMethod: string;
            discountCardId?: number | null;
        },
    ) => void;
    isCompletingPayment?: boolean;
}

const RECEIPT_WIDTH_PX = 302;
const RESTAURANT_CONTACT = {
    address:
        'Dar-ul-Aman Road, Next to Ministry of Industry and Commerce, Katawazi Tower, Kabul, Afghanistan.',
    website: 'www.babataste.com',
    whatsapp: ['+93 780 59 59 59'],
    emails: ['info@babataste.com'],
};

const RECEIPT_FOOTER_NOTE = {
    title: 'Thank You for Choosing Baba Restaurant',
    message:
        'We truly appreciate your order and look forward to serving you again soon.',
};
const RECEIPT_QR_LABEL = 'Scan to connect';

const BRAND_COLORS = {
    primary: '#102F33',
    secondary: '#CC924B',
    light: '#BCBEC0',
    dark: '#414042',
    white: '#FFFFFF',
};

const createPrintIcon = (path: string, strokeWidth = 1.8) =>
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;"><path d="${path}" stroke="${BRAND_COLORS.primary}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const printIcons = {
    mapPin: createPrintIcon(
        'M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z',
    ),
    phone: createPrintIcon(
        'M22 16.92V19.92C22.0001 20.1985 21.942 20.474 21.8295 20.7289C21.717 20.9837 21.5525 21.2121 21.346 21.3999C21.1395 21.5877 20.896 21.7307 20.631 21.8198C20.366 21.9089 20.0854 21.942 19.807 21.917C16.7198 21.5815 13.7541 20.5265 11.157 18.84C8.74088 17.3047 6.69283 15.2561 5.158 12.8399C3.46592 10.231 2.41017 7.25111 2.08099 4.14995C2.05589 3.87206 2.08886 3.59202 2.17778 3.32757C2.26669 3.06311 2.40959 2.82017 2.59712 2.61403C2.78465 2.40789 3.01272 2.24311 3.26719 2.1303C3.52165 2.0175 3.79686 1.95913 4.075 1.95895H7.075C7.56155 1.95416 8.03324 2.12253 8.40698 2.43454C8.78071 2.74654 9.0328 3.18234 9.118 3.66195C9.27629 4.60548 9.54055 5.52819 9.907 6.41295C10.0418 6.73627 10.0814 7.09144 10.0212 7.43682C9.96096 7.7822 9.80348 8.10307 9.567 8.36195L8.297 9.63195C9.72056 12.1347 11.7943 14.2084 14.297 15.632L15.567 14.362C15.8259 14.1255 16.1468 13.968 16.4921 13.9078C16.8375 13.8476 17.1927 13.8871 17.516 14.022C18.4008 14.3884 19.3235 14.6527 20.267 14.811C20.7518 14.8969 21.1918 15.1543 21.5045 15.5348C21.8173 15.9154 21.9827 16.3959 21.971 16.8899Z',
    ),
    whatsapp: createPrintIcon(
        'M21 11.5C21.0012 13.0117 20.6041 14.497 19.848 15.806L21 20L16.694 18.87C15.3423 19.6117 13.8258 19.9998 12.2845 20C10.7433 20.0002 9.22675 19.6125 7.875 18.871C6.36353 18.0441 5.15596 16.7525 4.42513 15.1873C3.6943 13.6221 3.47877 11.8625 3.80895 10.1668C4.13913 8.47113 4.9984 6.92386 6.25964 5.75087C7.52088 4.57789 9.12618 3.83153 10.8424 3.61853C12.5586 3.40553 14.2988 3.73683 15.817 4.56589C17.3352 5.39495 18.5551 6.6808 19.306 8.243C20.057 9.8052 20.3021 11.5622 20.007 13.27 M8.5 8.75C8.5 8.75 9 11 11 12.5C12.5 13.625 13.75 13.75 13.75 13.75 M14.75 13.25L13.5 14.5 M9 8.5L7.75 9.75',
        1.6,
    ),
    mail: createPrintIcon(
        'M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z M22 6L12 13L2 6',
    ),
    globe: createPrintIcon(
        'M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22M2.5 9H21.5M2.5 15H21.5',
        1.5,
    ),
};

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

export function ReceiptPreviewDialog({
    order,
    open,
    onOpenChange,
    paymentMethod = 'cash',
    onPaymentMethodChange,
    discountCards = [],
    onCompletePayment,
    isCompletingPayment = false,
}: ReceiptPreviewDialogProps) {
    const { t, locale, direction, isRtl } = useLocalization();
    const dateLocale = useMemo(() => {
        if (locale === 'fa') {
            return 'fa-AF';
        }

        if (locale === 'ps') {
            return 'ps-AF';
        }

        return 'en-US';
    }, [locale]);
    const [manualDiscount, setManualDiscount] = useState(
        String(Number(order?.discount_amount ?? 0) || 0),
    );
    const [selectedDiscountCardId, setSelectedDiscountCardId] = useState(
        order?.discount_card_id ? String(order.discount_card_id) : '',
    );
    const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
    const isPaymentCompleted = (order?.status ?? 'pending') === 'completed';
    const canFinalizePayment =
        !!order &&
        ((order.status ?? 'pending') === 'ready' ||
            (order.status ?? 'pending') === 'completed') &&
        typeof onCompletePayment === 'function';

    const subtotal = useMemo(() => {
        if (!order) {
            return 0;
        }
        if (order.items?.length) {
            return order.items.reduce((total, item) => {
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 0;
                return total + price * qty;
            }, 0);
        }

        return Number(order.total_amount) || 0;
    }, [order]);

    const selectedDiscountCard = useMemo(
        () =>
            discountCards.find(
                (card) => String(card.id) === selectedDiscountCardId,
            ) ?? null,
        [discountCards, selectedDiscountCardId],
    );
    const discountValue = useMemo(() => {
        if (selectedDiscountCard) {
            const rawValue =
                selectedDiscountCard.discount_type === 'percentage'
                    ? subtotal *
                      ((Number(selectedDiscountCard.discount_value) || 0) / 100)
                    : Number(selectedDiscountCard.discount_value) || 0;
            const cappedValue =
                selectedDiscountCard.max_discount_amount !== undefined &&
                selectedDiscountCard.max_discount_amount !== null
                    ? Math.min(
                          rawValue,
                          Number(selectedDiscountCard.max_discount_amount) || 0,
                      )
                    : rawValue;

            return Math.max(0, Math.min(subtotal, cappedValue));
        }

        return Math.max(0, Math.min(subtotal, Number(manualDiscount) || 0));
    }, [manualDiscount, selectedDiscountCard, subtotal]);
    const finalTotal = Math.max(0, subtotal - discountValue);
    const createdAt = order?.created_at
        ? new Date(order.created_at).toLocaleString(dateLocale)
        : '-';
    const symbolLogoSrc = brand.logo.startsWith('http')
        ? brand.logo
        : `${window.location.origin}${brand.logo}`;
    const whatsappQrTarget = useMemo(() => {
        const phone = RESTAURANT_CONTACT.whatsapp[0]?.replace(/\D+/g, '') ?? '';
        const message = encodeURIComponent(
            'Hello Baba Restaurant, I would like to get in touch.',
        );

        return `https://wa.me/${phone}?text=${message}`;
    }, []);
    const qrCodeSrc = useMemo(
        () =>
            `https://api.qrserver.com/v1/create-qr-code/?size=96x96&margin=0&data=${encodeURIComponent(
                whatsappQrTarget,
            )}`,
        [whatsappQrTarget],
    );
    const orderTypeLabel = order?.order_type
        ? t(
              `orders.orderType.${order.order_type}`,
              order.order_type.replace('_', ' '),
          )
        : '-';

    const printReceipt = () => {
        if (!order) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=420,height=760');
        if (!printWindow) {
            return;
        }

        const rows = (order.items ?? [])
            .map((item) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                const lineTotal = qty * price;
                return `
                    <tr>
                        <td>${escapeHtml(item.product_name ?? item.product_name_snapshot ?? item.product?.name ?? '-')}</td>
                        <td style="text-align:center">${qty}</td>
                        <td style="text-align:right">${escapeHtml(formatAfn(price))}</td>
                        <td style="text-align:right">${escapeHtml(formatAfn(lineTotal))}</td>
                    </tr>
                `;
            })
            .join('');

        const deliveryDetails =
            order.order_type === 'delivery'
                ? `
                    <p><strong>${escapeHtml(t('orders.receipt.customer', 'Customer'))}:</strong> ${escapeHtml(order.customer_name ?? '-')}</p>
                    <p><strong>${escapeHtml(t('orders.receipt.phone', 'Phone'))}:</strong> ${escapeHtml(order.customer_phone ?? '-')}</p>
                    <p><strong>${escapeHtml(t('orders.receipt.address', 'Address'))}:</strong> ${escapeHtml(order.delivery_address ?? '-')}</p>
                `
                : '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order #${order.id} Receipt</title>
                    <style>
                        @page { size: 80mm auto; margin: 4mm; }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: ${BRAND_COLORS.dark}; direction: ${direction}; }
                        .receipt { width: 100%; margin: 0 auto; padding: 0 5mm 0 2mm; box-sizing: border-box; font-size: 12px; color: ${BRAND_COLORS.dark}; }
                        .center { text-align: center; }
                        .meta p { margin: 3px 0; line-height: 1.35; }
                        .muted { color: ${BRAND_COLORS.dark}; opacity: 0.7; }
                        hr { border: none; border-top: 1px dashed ${BRAND_COLORS.light}; margin: 8px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { font-size: 11px; padding: 3px 0; }
                        .totals p { display: flex; justify-content: space-between; margin: 3px 0; }
                        img { width: 34px; height: 34px; object-fit: contain; }
                        .footer-wrap { display:grid; grid-template-columns:1fr 64px; gap:10px; align-items:start; }
                        .footer-row { display:flex; gap:6px; align-items:flex-start; margin:4px 0; }
                        .footer-icon { width:14px; min-width:14px; height:14px; display:flex; align-items:center; justify-content:center; }
                        .footer-qr { text-align:center; }
                        .footer-qr img { width:56px; height:56px; object-fit:contain; display:block; margin:0 auto 4px; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="center">
                            <img src="${symbolLogoSrc}" alt="${escapeHtml(brand.name)} Logo" style="width:42px;height:42px;object-fit:contain;" />
                            <h3 style="margin:6px 0 2px;color:${BRAND_COLORS.primary};">${escapeHtml(brand.name)}</h3>
                            <p class="muted" style="margin:0;">${escapeHtml(t('orders.receipt.receiptTitle', 'Order Receipt'))}</p>
                        </div>
                        <hr />
                        <div class="meta">
                            <p><strong>${escapeHtml(t('orders.receipt.order', 'Order'))}:</strong> #${order.id}</p>
                            <p><strong>${escapeHtml(t('orders.receipt.date', 'Date'))}:</strong> ${escapeHtml(createdAt)}</p>
                            <p><strong>${escapeHtml(t('orders.receipt.type', 'Type'))}:</strong> ${escapeHtml(orderTypeLabel)}</p>
                            ${deliveryDetails}
                        </div>
                        <hr />
                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align:${isRtl ? 'right' : 'left'};">${escapeHtml(t('orders.receipt.item', 'Item'))}</th>
                                    <th style="text-align:center;">${escapeHtml(t('orders.receipt.qty', 'Qty'))}</th>
                                    <th style="text-align:right;">${escapeHtml(t('orders.receipt.price', 'Price'))}</th>
                                    <th style="text-align:right;">${escapeHtml(t('orders.receipt.total', 'Total'))}</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                        <hr />
                        <div class="totals">
                            <p><span>${escapeHtml(t('orders.receipt.subtotal', 'Subtotal'))}</span><span>${escapeHtml(formatAfn(subtotal))}</span></p>
                            <p><span>${escapeHtml(t('orders.receipt.discountShort', 'Discount'))}</span><span>${escapeHtml(formatAfn(discountValue))}</span></p>
                            <p><strong>${escapeHtml(t('orders.receipt.grandTotal', 'Grand Total'))}</strong><strong>${escapeHtml(formatAfn(finalTotal))}</strong></p>
                        </div>
                        <hr />
                        <div class="center" style="font-size:10px;line-height:1.5;margin-bottom:8px;">
                            <div style="font-weight:700;color:${BRAND_COLORS.primary};">${escapeHtml(RECEIPT_FOOTER_NOTE.title)}</div>
                            <div class="muted">${escapeHtml(RECEIPT_FOOTER_NOTE.message)}</div>
                        </div>
                        <hr />
                        <div class="footer-wrap muted" style="font-size:10px;">
                            <div>
                                <div class="footer-row"><span class="footer-icon">${printIcons.mapPin}</span><span>${escapeHtml(RESTAURANT_CONTACT.address)}</span></div>
                            </div>
                            <div class="footer-qr">
                                <img src="${qrCodeSrc}" alt="QR Code" />
                                <div style="font-size:9px;color:${BRAND_COLORS.dark};opacity:0.75;">${escapeHtml(RECEIPT_QR_LABEL)}</div>
                            </div>
                        </div>
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

    const handleCompletePayment = () => {
        if (!order || !onCompletePayment) {
            return;
        }

        onCompletePayment(order, {
            discountAmount: discountValue,
            paymentMethod,
            discountCardId: selectedDiscountCard
                ? Number(selectedDiscountCard.id)
                : null,
        });
        setIsConfirmPaymentOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setManualDiscount('0');
                    setSelectedDiscountCardId('');
                    setIsConfirmPaymentOpen(false);
                }
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5" />
                        {t('orders.receipt.title', 'Print Receipt Preview')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'orders.receipt.description',
                            'Preview on X-Printer size. Adjust discount if needed, then print.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                {order ? (
                    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                        <div className="space-y-3 rounded-md border p-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    Discount Card
                                </label>
                                <Select
                                    value={selectedDiscountCardId || '__none__'}
                                    onValueChange={(value) => {
                                        const nextValue =
                                            value === '__none__' ? '' : value;
                                        setSelectedDiscountCardId(nextValue);
                                    }}
                                    disabled={isPaymentCompleted}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select discount card" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">
                                            No discount card
                                        </SelectItem>
                                        {discountCards.map((card) => (
                                            <SelectItem
                                                key={card.id}
                                                value={String(card.id)}
                                            >
                                                {card.name} •{' '}
                                                {card.discount_type ===
                                                'percentage'
                                                    ? `${Number(card.discount_value) || 0}%`
                                                    : formatAfn(
                                                          card.discount_value ??
                                                              0,
                                                      )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    {t(
                                        'orders.receipt.discount',
                                        'Discount (AFN)',
                                    )}
                                </label>
                                <NumericInput
                                    min="0"
                                    value={
                                        selectedDiscountCard
                                            ? String(discountValue)
                                            : manualDiscount
                                    }
                                    onValueChange={setManualDiscount}
                                    disabled={
                                        isPaymentCompleted ||
                                        !!selectedDiscountCard
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    {t(
                                        'orders.form.paymentMethod',
                                        'Payment Method',
                                    )}
                                </label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(value) =>
                                        onPaymentMethodChange?.(value)
                                    }
                                    disabled={isPaymentCompleted}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">
                                            {t(
                                                'orders.paymentMethod.cash',
                                                'Cash',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="credit_card">
                                            {t(
                                                'orders.paymentMethod.credit_card',
                                                'Credit Card',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="bank_transfer">
                                            {t(
                                                'orders.paymentMethod.bank_transfer',
                                                'Bank Transfer',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="other">
                                            {t(
                                                'orders.paymentMethod.other',
                                                'Other',
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="text-sm">
                                <p className="flex items-center justify-between">
                                    <span>
                                        {t(
                                            'orders.receipt.subtotal',
                                            'Subtotal',
                                        )}
                                    </span>
                                    <span>{formatAfn(subtotal)}</span>
                                </p>
                                <p className="flex items-center justify-between">
                                    <span>
                                        {t(
                                            'orders.receipt.discountShort',
                                            'Discount',
                                        )}
                                    </span>
                                    <span>{formatAfn(discountValue)}</span>
                                </p>
                                <p className="mt-2 flex items-center justify-between text-base font-semibold">
                                    <span>
                                        {t(
                                            'orders.receipt.grandTotal',
                                            'Grand Total',
                                        )}
                                    </span>
                                    <span>{formatAfn(finalTotal)}</span>
                                </p>
                            </div>

                            {canFinalizePayment ? (
                                <Button
                                    onClick={() =>
                                        setIsConfirmPaymentOpen(true)
                                    }
                                    className="gap-2"
                                    disabled={
                                        isCompletingPayment ||
                                        isPaymentCompleted
                                    }
                                    variant="outline"
                                >
                                    <ReceiptText className="h-4 w-4" />
                                    {isPaymentCompleted
                                        ? t(
                                              'orders.receipt.paymentCompleted',
                                              'Payment Completed',
                                          )
                                        : t(
                                              'orders.receipt.markPaymentCompleted',
                                              'Payment Completed',
                                          )}
                                </Button>
                            ) : null}

                            <Button
                                onClick={printReceipt}
                                className="mx-1 gap-2"
                                disabled={!isPaymentCompleted}
                                variant="outline"
                            >
                                <Printer className="h-4 w-4" />
                                {t(
                                    'orders.receipt.printReceipt',
                                    'Print Receipt',
                                )}
                            </Button>
                        </div>

                        <div className="rounded-md border bg-muted/20 p-3">
                            <ScrollArea className="h-[560px]">
                                <div
                                    className="mx-auto rounded-md border bg-white py-3 pr-5 pl-3 text-[11px] text-neutral-900"
                                    style={{ width: `${RECEIPT_WIDTH_PX}px` }}
                                >
                                    <div className="text-center">
                                        <img
                                            src={brand.logo}
                                            alt={`${brand.name} Logo`}
                                            className="mx-auto h-12 w-auto max-w-[64px] object-contain"
                                        />
                                        <p className="mt-1 text-sm font-semibold">
                                            {brand.name}
                                        </p>
                                        <p className="text-[10px] text-neutral-500">
                                            {t(
                                                'orders.receipt.receiptTitle',
                                                'Order Receipt',
                                            )}
                                        </p>
                                    </div>
                                    <div className="my-2 border-t border-dashed" />
                                    <p>
                                        <span className="font-medium">
                                            {t('orders.receipt.order', 'Order')}
                                            :
                                        </span>{' '}
                                        #{order.id}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            {t('orders.receipt.date', 'Date')}:
                                        </span>{' '}
                                        {createdAt}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            {t('orders.receipt.type', 'Type')}:
                                        </span>{' '}
                                        {orderTypeLabel}
                                    </p>
                                    {order.order_type === 'delivery' ? (
                                        <>
                                            <p>
                                                <span className="font-medium">
                                                    {t(
                                                        'orders.receipt.customer',
                                                        'Customer',
                                                    )}
                                                    :
                                                </span>{' '}
                                                {order.customer_name ?? '-'}
                                            </p>
                                            <p>
                                                <span className="font-medium">
                                                    {t(
                                                        'orders.receipt.phone',
                                                        'Phone',
                                                    )}
                                                    :
                                                </span>{' '}
                                                {order.customer_phone ?? '-'}
                                            </p>
                                            <p>
                                                <span className="font-medium">
                                                    {t(
                                                        'orders.receipt.address',
                                                        'Address',
                                                    )}
                                                    :
                                                </span>{' '}
                                                {order.delivery_address ?? '-'}
                                            </p>
                                        </>
                                    ) : null}
                                    <div className="my-2 border-t border-dashed" />
                                    <div className="space-y-1">
                                        {(order.items ?? []).map((item) => {
                                            const qty =
                                                Number(item.quantity) || 0;
                                            const price =
                                                Number(item.price) || 0;
                                            const lineTotal = qty * price;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="grid grid-cols-[1fr_auto_auto] gap-2"
                                                >
                                                    <p className="truncate">
                                                        {item.product_name ??
                                                            item.product_name_snapshot ??
                                                            item.product
                                                                ?.name ??
                                                            '-'}
                                                    </p>
                                                    <p>x{qty}</p>
                                                    <p className="text-right">
                                                        {formatAfn(lineTotal)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="my-2 border-t border-dashed" />
                                    <p className="flex items-center justify-between">
                                        <span>
                                            {t(
                                                'orders.receipt.subtotal',
                                                'Subtotal',
                                            )}
                                        </span>
                                        <span>{formatAfn(subtotal)}</span>
                                    </p>
                                    <p className="flex items-center justify-between">
                                        <span>
                                            {t(
                                                'orders.receipt.discountShort',
                                                'Discount',
                                            )}
                                        </span>
                                        <span>{formatAfn(discountValue)}</span>
                                    </p>
                                    <p className="flex items-center justify-between font-semibold">
                                        <span>
                                            {t(
                                                'orders.receipt.grandTotal',
                                                'Grand Total',
                                            )}
                                        </span>
                                        <span>{formatAfn(finalTotal)}</span>
                                    </p>
                                    <div className="my-2 border-t border-dashed" />
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold text-[#102F33]">
                                            {RECEIPT_FOOTER_NOTE.title}
                                        </p>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-500">
                                            {RECEIPT_FOOTER_NOTE.message}
                                        </p>
                                    </div>
                                    <div className="my-2 border-t border-dashed" />
                                    <div className="mt-2 grid grid-cols-[1fr_68px] gap-3 text-[10px] text-neutral-600">
                                        <div className="flex items-start space-y-1 pt-1">
                                            <p className="flex items-start gap-2">
                                                <IconMapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#102F33]" />
                                                <span className="text-[10px]">
                                                    {RESTAURANT_CONTACT.address}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <img
                                                src={qrCodeSrc}
                                                alt="QR Code"
                                                className="mx-auto h-14 w-14 object-contain"
                                            />
                                            <p className="mt-1 text-[9px] text-neutral-500">
                                                {RECEIPT_QR_LABEL}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                ) : null}
            </DialogContent>

            <AlertDialog
                open={isConfirmPaymentOpen}
                onOpenChange={setIsConfirmPaymentOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t(
                                'orders.receipt.confirmPaymentCompletionTitle',
                                'Complete payment?',
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'orders.receipt.confirmPaymentCompletion',
                                'Confirm payment completion and post this order to finance?',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCompletePayment}
                            disabled={
                                isCompletingPayment || !canFinalizePayment
                            }
                            variant={'outline'}
                        >
                            {isCompletingPayment
                                ? t('common.processing', 'Processing...')
                                : t(
                                      'orders.receipt.markPaymentCompleted',
                                      'Payment Completed',
                                  )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
