import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
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
import { DiscountCard, Employee, Order } from '@/types';
import { formatAfn } from '@/utils/format';
import { IconMapPin } from '@tabler/icons-react';
import { Printer, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface ReceiptPreviewDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paymentMethod?: string;
    onPaymentMethodChange?: (value: string) => void;
    discountCards?: DiscountCard[];
    sponsorEmployees?: Employee[];
    onCompletePayment?: (
        order: Order,
        payload: {
            discountAmount: number;
            paymentMethod: string;
            discountCardId?: number | null;
            coveredByType?: 'customer' | 'employee' | 'house';
            coveredByEmployeeId?: number | null;
            coveredByNote?: string | null;
        },
    ) => void;
    isCompletingPayment?: boolean;
}

const RECEIPT_WIDTH_PX = 302;
const RESTAURANT_CONTACT = {
    address:
        'Dar-ul-Aman Road, Next to Ministry of Industry and Commerce, Katawazi Tower, Kabul, Afghanistan.',
    whatsapp: ['+93 780 59 59 59'],
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
    sponsorEmployees = [],
    onCompletePayment,
    isCompletingPayment = false,
}: ReceiptPreviewDialogProps) {
    const { t, locale, direction } = useLocalization();
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
    const [selectedSponsorEmployeeId, setSelectedSponsorEmployeeId] = useState(
        order?.covered_by_employee_id ? String(order.covered_by_employee_id) : '',
    );
    const [coveredByType, setCoveredByType] = useState<
        'customer' | 'employee' | 'house'
    >(
        order?.covered_by_type === 'employee' || order?.covered_by_type === 'house'
            ? order.covered_by_type
            : 'customer',
    );
    const [sponsorNote, setSponsorNote] = useState(order?.covered_by_note ?? '');
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
    const orderBranchId = order?.branch_id ?? null;
    const availableSponsorEmployees = useMemo(() => {
        if (!orderBranchId) {
            return sponsorEmployees;
        }

        return sponsorEmployees.filter(
            (employee) =>
                employee.branch_id === null || employee.branch_id === orderBranchId,
        );
    }, [orderBranchId, sponsorEmployees]);
    const sponsorEmployeeOptions = useMemo(
        () =>
            availableSponsorEmployees.map((employee) => ({
                value: String(employee.id),
                label:
                    employee.full_name?.trim() ||
                    [employee.first_name, employee.last_name].filter(Boolean).join(' '),
            })),
        [availableSponsorEmployees],
    );
    const selectedSponsorEmployee = useMemo(
        () =>
            availableSponsorEmployees.find(
                (employee) => String(employee.id) === selectedSponsorEmployeeId,
            ) ?? null,
        [availableSponsorEmployees, selectedSponsorEmployeeId],
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
                    <div class="item-row">
                        <p class="item-name">${escapeHtml(item.product_name ?? item.product_name_snapshot ?? item.product?.name ?? '-')}</p>
                        <p class="item-qty">x${qty}</p>
                        <p class="item-total">${escapeHtml(formatAfn(lineTotal))}</p>
                    </div>
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
                        .receipt { width: 100%; margin: 0 auto; padding: 0 4mm 0 3mm; box-sizing: border-box; font-size: 11px; color: ${BRAND_COLORS.dark}; }
                        .center { text-align: center; }
                        .meta p { margin: 3px 0; line-height: 1.35; }
                        .muted { color: ${BRAND_COLORS.dark}; opacity: 0.7; }
                        hr { border: none; border-top: 1px dashed ${BRAND_COLORS.light}; margin: 8px 0; }
                        .items { display:flex; flex-direction:column; gap:4px; }
                        .item-row { display:grid; grid-template-columns:1fr auto auto; gap:8px; align-items:start; }
                        .item-name { margin:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
                        .item-qty { margin:0; }
                        .item-total { margin:0; text-align:right; }
                        .totals p { display: flex; justify-content: space-between; margin: 3px 0; }
                        img { width: 34px; height: 34px; object-fit: contain; }
                        .footer-wrap { display:grid; grid-template-columns:1fr 68px; gap:12px; align-items:start; }
                        .footer-row { display:flex; gap:6px; align-items:flex-start; margin:4px 0; }
                        .footer-icon { width:14px; min-width:14px; height:14px; display:flex; align-items:center; justify-content:center; }
                        .footer-qr { text-align:center; }
                        .footer-qr img { width:56px; height:56px; object-fit:contain; display:block; margin:0 auto 4px; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="center">
                            <img src="${symbolLogoSrc}" alt="${escapeHtml(brand.name)} Logo" style="width:48px;height:48px;object-fit:contain;" />
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
                        <div class="items">${rows}</div>
                        <hr />
                        <div class="totals">
                            <p><span>${escapeHtml(t('orders.receipt.subtotal', 'Subtotal'))}</span><span>${escapeHtml(formatAfn(subtotal))}</span></p>
                            <p><span>${escapeHtml(t('orders.receipt.discountShort', 'Discount'))}</span><span>${escapeHtml(formatAfn(discountValue))}</span></p>
                            <p><strong>${escapeHtml(t('orders.receipt.grandTotal', 'Grand Total'))}</strong><strong>${escapeHtml(formatAfn(finalTotal))}</strong></p>
                        </div>
                        <hr />
                        <div class="center" style="font-size:10px;line-height:1.5;margin-bottom:8px;">
                            <div style="font-weight:700;font-size:10px;color:${BRAND_COLORS.primary};">${escapeHtml(RECEIPT_FOOTER_NOTE.title)}</div>
                            <div class="muted" style="font-size:10px;line-height:1.55;">${escapeHtml(RECEIPT_FOOTER_NOTE.message)}</div>
                        </div>
                        <hr />
                        <div class="footer-wrap muted" style="font-size:10px;">
                            <div>
                                <div class="footer-row"><span class="footer-icon">${printIcons.mapPin}</span><span style="font-size:10px;line-height:1.55;">${escapeHtml(RESTAURANT_CONTACT.address)}</span></div>
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
            coveredByType,
            coveredByEmployeeId: selectedSponsorEmployee
                ? Number(selectedSponsorEmployee.id)
                : null,
            coveredByNote: selectedSponsorEmployee
                ? sponsorNote.trim() || null
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
                    setCoveredByType('customer');
                    setSelectedSponsorEmployeeId('');
                    setSponsorNote('');
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
                                        'orders.receipt.coveredByType',
                                        'Settlement Type',
                                    )}
                                </label>
                                <Select
                                    value={coveredByType}
                                    onValueChange={(value) => {
                                        const nextValue = value as
                                            | 'customer'
                                            | 'employee'
                                            | 'house';
                                        setCoveredByType(nextValue);
                                        if (nextValue !== 'employee') {
                                            setSelectedSponsorEmployeeId('');
                                        }
                                    }}
                                    disabled={isPaymentCompleted}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="customer">
                                            {t(
                                                'orders.receipt.coveredByTypeCustomer',
                                                'Customer Payment',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="employee">
                                            {t(
                                                'orders.receipt.coveredByTypeEmployee',
                                                'Employee Cover',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="house">
                                            {t(
                                                'orders.receipt.coveredByTypeHouse',
                                                'House Hospitality / Comp',
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
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
                                    disabled={isPaymentCompleted || coveredByType === 'house'}
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
                                {coveredByType === 'house' ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'orders.receipt.houseCompNote',
                                            'House hospitality completes the order without recording a payment collection.',
                                        )}
                                    </p>
                                ) : null}
                            </div>

                            {coveredByType === 'employee' ? (
                                <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    {t(
                                        'orders.receipt.coveredByEmployee',
                                        'Covered By Employee',
                                    )}
                                </label>
                                <SearchableDropdown
                                    value={selectedSponsorEmployeeId}
                                    options={sponsorEmployeeOptions}
                                    onValueChange={setSelectedSponsorEmployeeId}
                                    placeholder={t(
                                        'orders.receipt.coveredByEmployeePlaceholder',
                                        'Select employee if this order is being covered',
                                    )}
                                    searchPlaceholder={t(
                                        'orders.receipt.coveredByEmployeeSearch',
                                        'Search employees...',
                                    )}
                                    emptyText={t(
                                        'orders.receipt.coveredByEmployeeEmpty',
                                        'No active employee found.',
                                    )}
                                    className="w-full"
                                />
                                {selectedSponsorEmployee ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-auto justify-start px-0 text-xs text-muted-foreground"
                                        onClick={() => {
                                            setSelectedSponsorEmployeeId('');
                                            setSponsorNote('');
                                        }}
                                        disabled={isPaymentCompleted}
                                    >
                                        {t(
                                            'orders.receipt.clearCoveredByEmployee',
                                            'Clear employee coverage',
                                        )}
                                    </Button>
                                ) : null}
                                </div>
                            ) : null}

                            {coveredByType !== 'customer' ? (
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        {t(
                                            'orders.receipt.coveredByNote',
                                            'Coverage Note',
                                        )}
                                    </label>
                                    <Textarea
                                        value={sponsorNote}
                                        onChange={(event) =>
                                            setSponsorNote(event.target.value)
                                        }
                                        placeholder={
                                            coveredByType === 'house'
                                                ? t(
                                                      'orders.receipt.coveredByNoteHousePlaceholder',
                                                      'Optional note such as owner hospitality, manager guest, or house comp reason.',
                                                  )
                                                : t(
                                                      'orders.receipt.coveredByNotePlaceholder',
                                                      'Optional note such as owner guest, manager guest, or hospitality.',
                                                  )
                                        }
                                        disabled={isPaymentCompleted}
                                        rows={3}
                                    />
                                </div>
                            ) : null}

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
                                {coveredByType === 'employee' && selectedSponsorEmployee ? (
                                    <div className="mt-3 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                            {`${t('orders.receipt.coveredByEmployeeSummary', 'This order is being covered by')} ${selectedSponsorEmployee.full_name ?? [selectedSponsorEmployee.first_name, selectedSponsorEmployee.last_name].filter(Boolean).join(' ')}`}
                                        </p>
                                        {sponsorNote.trim() ? (
                                            <p className="mt-1">{sponsorNote.trim()}</p>
                                        ) : null}
                                    </div>
                                ) : null}
                                {coveredByType === 'house' ? (
                                    <div className="mt-3 rounded-md border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                                        <p className="font-medium">
                                            {t(
                                                'orders.receipt.houseCompSummary',
                                                'This order will be recorded as house hospitality / comp.',
                                            )}
                                        </p>
                                        {sponsorNote.trim() ? (
                                            <p className="mt-1">{sponsorNote.trim()}</p>
                                        ) : null}
                                    </div>
                                ) : null}
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
                                        <div className="pt-1">
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
