import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Order } from '@/types';
import { formatAfn } from '@/utils/format';
import { Printer, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ReceiptPreviewDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const RECEIPT_WIDTH_PX = 302;

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
                        <td>${escapeHtml(item.product?.name ?? '-')}</td>
                        <td style="text-align:center">${qty}</td>
                        <td style="text-align:right">${escapeHtml(formatAfn(price))}</td>
                        <td style="text-align:right">${escapeHtml(formatAfn(lineTotal))}</td>
                    </tr>
                `;
            })
            .join('');

        const deliveryAddress =
            order.order_type === 'delivery'
                ? `<p><strong>Address:</strong> ${escapeHtml(order.branch?.address ?? '-')}</p>`
                : '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order #${order.id} Receipt</title>
                    <style>
                        @page { size: 80mm auto; margin: 4mm; }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                        .receipt { width: 72mm; margin: 0 auto; font-size: 12px; color: #111; }
                        .center { text-align: center; }
                        .muted { color: #555; }
                        hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { font-size: 11px; padding: 3px 0; }
                        .totals p { display: flex; justify-content: space-between; margin: 3px 0; }
                        img { width: 34px; height: 34px; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="center">
                            <img src="${window.location.origin}/brand/logo.png" alt="Baba Restaurant Logo" />
                            <h3 style="margin:6px 0 2px;">Baba Restaurant</h3>
                            <p class="muted" style="margin:0;">Order Receipt</p>
                        </div>
                        <hr />
                        <p><strong>Order:</strong> #${order.id}</p>
                        <p><strong>Date:</strong> ${escapeHtml(createdAt)}</p>
                        <p><strong>Type:</strong> ${escapeHtml(orderTypeLabel)}</p>
                        ${deliveryAddress}
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
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={discount}
                                    onChange={(event) =>
                                        setDiscount(event.target.value)
                                    }
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
                                        <p>
                                            <span className="font-medium">
                                                Address:
                                            </span>{' '}
                                            {order.branch?.address ?? '-'}
                                        </p>
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
                                                        {item.product?.name ??
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
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
