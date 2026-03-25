import { NumericInput } from '@/components/shared/numeric-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Order } from '@/types';
import { formatAfn } from '@/utils/format';
import {
    IconBrandFacebook,
    IconBrandInstagram,
    IconBrandTiktok,
    IconBrandYoutube,
} from '@tabler/icons-react';
import {
    Printer,
    ReceiptText,
} from 'lucide-react';
import {
    Globe,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
} from 'react-feather';
import { useMemo, useState } from 'react';

interface ReceiptPreviewDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const RECEIPT_WIDTH_PX = 302;
const RESTAURANT_CONTACT = {
    address:
        'Dar-ul-Aman Road, Next to Ministry of Industry and Commerce, Katawazi Tower, Kabul',
    website: 'www.babataste.com',
    phones: ['+93 780 59 59 59', '+93 796 85 85 85'],
    emails: ['info@babataste.com', 'reservations@babataste.com'],
    socialHandle: 'Baba Restaurant',
};

const BRAND_COLORS = {
    primary: '#102F33',
    secondary: '#CC924B',
    light: '#BCBEC0',
    dark: '#414042',
    white: '#FFFFFF',
};

const socialBadgesHtml = `
    <div style="display:flex;justify-content:center;gap:6px;align-items:center;margin-top:8px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;background:${BRAND_COLORS.primary};color:${BRAND_COLORS.white};font-size:10px;font-weight:700;">f</span>
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;background:${BRAND_COLORS.primary};color:${BRAND_COLORS.white};font-size:8px;font-weight:700;">ig</span>
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;background:${BRAND_COLORS.primary};color:${BRAND_COLORS.white};font-size:8px;font-weight:700;">tt</span>
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;background:${BRAND_COLORS.primary};color:${BRAND_COLORS.white};font-size:8px;font-weight:700;">yt</span>
        <span style="font-size:10px;color:${BRAND_COLORS.dark};font-weight:600;">/ ${RESTAURANT_CONTACT.socialHandle}</span>
    </div>
`;

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
}: ReceiptPreviewDialogProps) {
    const [discount, setDiscount] = useState('0');

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

    const discountValue = Math.max(
        0,
        Math.min(subtotal, Number(discount) || 0),
    );
    const finalTotal = Math.max(0, subtotal - discountValue);
    const createdAt = order?.created_at
        ? new Date(order.created_at).toLocaleString()
        : '-';
    const orderTypeLabel = (order?.order_type ?? '-')
        .replace('_', ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

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
                    <p><strong>Customer:</strong> ${escapeHtml(order.customer_name ?? '-')}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(order.customer_phone ?? '-')}</p>
                    <p><strong>Address:</strong> ${escapeHtml(order.delivery_address ?? '-')}</p>
                `
                : '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order #${order.id} Receipt</title>
                    <style>
                        @page { size: 80mm auto; margin: 4mm; }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: ${BRAND_COLORS.dark}; }
                        .receipt { width: 72mm; margin: 0 auto; font-size: 12px; color: ${BRAND_COLORS.dark}; }
                        .center { text-align: center; }
                        .muted { color: ${BRAND_COLORS.dark}; opacity: 0.7; }
                        hr { border: none; border-top: 1px dashed ${BRAND_COLORS.light}; margin: 8px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { font-size: 11px; padding: 3px 0; }
                        .totals p { display: flex; justify-content: space-between; margin: 3px 0; }
                        img { width: 34px; height: 34px; object-fit: contain; }
                        .footer-row { display:flex; gap:6px; align-items:flex-start; margin:4px 0; }
                        .footer-icon { width:14px; font-size:10px; color:${BRAND_COLORS.primary}; font-weight:700; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="center">
                            <img src="${window.location.origin}/brand/logo.png" alt="Baba Restaurant Logo" />
                            <h3 style="margin:6px 0 2px;color:${BRAND_COLORS.primary};">Baba Restaurant</h3>
                            <p class="muted" style="margin:0;">Order Receipt</p>
                        </div>
                        <hr />
                        <p><strong>Order:</strong> #${order.id}</p>
                        <p><strong>Date:</strong> ${escapeHtml(createdAt)}</p>
                        <p><strong>Type:</strong> ${escapeHtml(orderTypeLabel)}</p>
                        ${deliveryDetails}
                        <hr />
                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align:left;">Item</th>
                                    <th style="text-align:center;">Qty</th>
                                    <th style="text-align:right;">Price</th>
                                    <th style="text-align:right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                        <hr />
                        <div class="totals">
                            <p><span>Subtotal</span><span>${escapeHtml(formatAfn(subtotal))}</span></p>
                            <p><span>Discount</span><span>${escapeHtml(formatAfn(discountValue))}</span></p>
                            <p><strong>Grand Total</strong><strong>${escapeHtml(formatAfn(finalTotal))}</strong></p>
                        </div>
                        <hr />
                        <div class="muted" style="font-size:10px;">
                            <div class="footer-row"><span class="footer-icon">⌂</span><span>${escapeHtml(RESTAURANT_CONTACT.address)}</span></div>
                            <div class="footer-row"><span class="footer-icon">☎</span><span>${escapeHtml(RESTAURANT_CONTACT.phones.join(' - '))}</span></div>
                            <div class="footer-row"><span class="footer-icon">✆</span><span>${escapeHtml(RESTAURANT_CONTACT.phones.join(' - '))}</span></div>
                            <div class="footer-row"><span class="footer-icon">✉</span><span>${escapeHtml(RESTAURANT_CONTACT.emails.join(' - '))}</span></div>
                            <div class="footer-row"><span class="footer-icon">⌘</span><span>${escapeHtml(RESTAURANT_CONTACT.website)}</span></div>
                        </div>
                        ${socialBadgesHtml}
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
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setDiscount('0');
                }
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5" />
                        Print Receipt Preview
                    </DialogTitle>
                    <DialogDescription>
                        Preview on X-Printer size. Adjust discount if needed,
                        then print.
                    </DialogDescription>
                </DialogHeader>

                {order ? (
                    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                        <div className="space-y-3 rounded-md border p-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    Discount (AFN)
                                </label>
                                <NumericInput
                                    min="0"
                                    value={discount}
                                    onValueChange={setDiscount}
                                />
                            </div>

                            <div className="text-sm">
                                <p className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatAfn(subtotal)}</span>
                                </p>
                                <p className="flex items-center justify-between">
                                    <span>Discount</span>
                                    <span>{formatAfn(discountValue)}</span>
                                </p>
                                <p className="mt-2 flex items-center justify-between text-base font-semibold">
                                    <span>Grand Total</span>
                                    <span>{formatAfn(finalTotal)}</span>
                                </p>
                            </div>

                            <Button onClick={printReceipt} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print Receipt
                            </Button>
                        </div>

                        <div className="rounded-md border bg-muted/20 p-3">
                            <ScrollArea className="h-[560px]">
                                <div
                                    className="mx-auto rounded-md border bg-white p-3 text-[11px] text-neutral-900"
                                    style={{ width: `${RECEIPT_WIDTH_PX}px` }}
                                >
                                    <div className="text-center">
                                        <img
                                            src="/brand/logo.png"
                                            alt="Baba Restaurant Logo"
                                            className="mx-auto h-8 w-8 object-contain"
                                        />
                                        <p className="mt-1 text-sm font-semibold">
                                            Baba Restaurant
                                        </p>
                                        <p className="text-[10px] text-neutral-500">
                                            Order Receipt
                                        </p>
                                    </div>
                                    <div className="my-2 border-t border-dashed" />
                                    <p>
                                        <span className="font-medium">
                                            Order:
                                        </span>{' '}
                                        #{order.id}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Date:
                                        </span>{' '}
                                        {createdAt}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Type:
                                        </span>{' '}
                                        {orderTypeLabel}
                                    </p>
                                    {order.order_type === 'delivery' ? (
                                        <>
                                            <p>
                                                <span className="font-medium">
                                                    Customer:
                                                </span>{' '}
                                                {order.customer_name ?? '-'}
                                            </p>
                                            <p>
                                                <span className="font-medium">
                                                    Phone:
                                                </span>{' '}
                                                {order.customer_phone ?? '-'}
                                            </p>
                                            <p>
                                                <span className="font-medium">
                                                    Address:
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
                                        <span>Subtotal</span>
                                        <span>{formatAfn(subtotal)}</span>
                                    </p>
                                    <p className="flex items-center justify-between">
                                        <span>Discount</span>
                                        <span>{formatAfn(discountValue)}</span>
                                    </p>
                                    <p className="flex items-center justify-between font-semibold">
                                        <span>Grand Total</span>
                                        <span>{formatAfn(finalTotal)}</span>
                                    </p>
                                    <div className="my-2 border-t border-dashed" />
                                    <div className="space-y-1 text-[10px] text-neutral-600">
                                        <p className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#102F33]" />
                                            <span>
                                                {RESTAURANT_CONTACT.address}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 shrink-0 text-[#102F33]" />
                                            <span>
                                                {RESTAURANT_CONTACT.phones.join(
                                                    ' - ',
                                                )}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <MessageCircle className="h-3 w-3 shrink-0 text-[#102F33]" />
                                            <span>
                                                {RESTAURANT_CONTACT.phones.join(
                                                    ' - ',
                                                )}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 shrink-0 text-[#102F33]" />
                                            <span>
                                                {RESTAURANT_CONTACT.emails.join(
                                                    ' - ',
                                                )}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Globe className="h-3 w-3 shrink-0 text-[#102F33]" />
                                            <span>
                                                {RESTAURANT_CONTACT.website}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-1 pt-1 text-[#102F33]">
                                            <IconBrandFacebook
                                                className="h-3.5 w-3.5"
                                                stroke={1.8}
                                            />
                                            <IconBrandInstagram
                                                className="h-3.5 w-3.5"
                                                stroke={1.8}
                                            />
                                            <IconBrandTiktok
                                                className="h-3.5 w-3.5"
                                                stroke={1.8}
                                            />
                                            <IconBrandYoutube
                                                className="h-3.5 w-3.5"
                                                stroke={1.8}
                                            />
                                            <span className="pl-1 text-[10px] font-medium">
                                                /{' '}
                                                {
                                                    RESTAURANT_CONTACT.socialHandle
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
