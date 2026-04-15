import { brand } from '@/config/brand';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Branch, CashMovement, CashMovementType } from '@/types';
import { formatAfn } from '@/utils/format';
import { Printer, ReceiptText } from 'lucide-react';

interface MovementVoucherPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    movement: CashMovement | null;
    branch: Branch | null;
    movementType: CashMovementType | null;
}

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
};

const formatDateOnly = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toISOString().slice(0, 10);
};

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

export function MovementVoucherPrintDialog({
    open,
    onOpenChange,
    movement,
    branch,
    movementType,
}: MovementVoucherPrintDialogProps) {
    const printVoucher = () => {
        if (!movement) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=960,height=1100');
        if (!printWindow) {
            return;
        }

        const voucherNo = `CSH-${movement.id}`;
        const amount = formatAfn(Number(movement.amount ?? 0));
        const createdAt = formatDateTime(movement.created_at);
        const movementDate = formatDateOnly(movement.movement_date);
        const direction = movement.direction === 'in' ? 'Inflow' : 'Outflow';
        const paymentMethod = (movement.payment_method ?? 'other')
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        printWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(voucherNo)} - Cash/Bank Voucher</title>
                    <style>
                        @page { size: A4 portrait; margin: 14mm; }
                        body { margin: 0; color: #0f172a; font-family: "Segoe UI", Tahoma, sans-serif; background: #ffffff; }
                        .sheet { max-width: 820px; min-height: calc(297mm - 28mm); margin: 0 auto; display: flex; flex-direction: column; }
                        .header { position: relative; padding: 10px 0 22px; border-bottom: 1px solid #dbe4ee; min-height: 118px; }
                        .header-left, .header-right { position: absolute; top: 8px; width: 220px; }
                        .header-left { left: 0; text-align: left; }
                        .header-right { right: 0; text-align: right; }
                        .header-label { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #64748b; margin: 0 0 8px; }
                        .header-value { font-size: 13px; color: #0f172a; margin: 3px 0; }
                        .brand { text-align: center; padding: 0 220px; }
                        .brand img { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto 8px; }
                        .brand h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: .03em; }
                        .brand p { margin: 4px 0 0; font-size: 12px; color: #475569; }
                        .content { flex: 1; padding: 24px 0 0; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 24px; }
                        .box { background: #f8fafc; border-radius: 12px; padding: 14px 16px; }
                        .label { display: block; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
                        .value { font-size: 15px; font-weight: 600; color: #0f172a; }
                        .table-wrap { margin-top: 6px; border-top: 2px solid #dbe4ee; border-bottom: 2px solid #dbe4ee; }
                        .table { width: 100%; border-collapse: collapse; }
                        .table th { text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: .08em; padding: 12px 8px; border-bottom: 1px solid #dbe4ee; }
                        .table td { font-size: 14px; padding: 16px 8px; border-bottom: 1px solid #eef2f7; vertical-align: top; }
                        .table tbody tr:last-child td { border-bottom: none; }
                        .table td.right, .table th.right { text-align: right; }
                        .note-box { margin-top: 20px; background: linear-gradient(180deg, #fafafa, #f8fafc); border-radius: 12px; padding: 16px 18px; }
                        .note-title { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
                        .note-text { margin: 0; font-size: 13px; line-height: 1.7; color: #334155; }
                        .summary { margin-top: 24px; width: 290px; margin-left: auto; }
                        .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dbe4ee; font-size: 14px; }
                        .summary-row.total { font-size: 18px; font-weight: 700; border-bottom: 2px solid #0f172a; padding-top: 16px; }
                        .signatures { margin-top: 72px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 28px; }
                        .signature { text-align: center; }
                        .signature-line { border-top: 1px solid #64748b; padding-top: 10px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #475569; }
                        .footer { margin-top: auto; padding-top: 26px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; }
                        .footer-note { max-width: 520px; font-size: 11px; line-height: 1.7; color: #64748b; }
                        .footer-stamp { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #94a3b8; }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="header">
                            <div class="header-left">
                                <p class="header-label">Voucher</p>
                                <p class="header-value"><strong>No:</strong> ${escapeHtml(voucherNo)}</p>
                                <p class="header-value"><strong>Date:</strong> ${escapeHtml(movementDate)}</p>
                            </div>
                            <div class="brand">
                                <img src="${brand.logoFull.startsWith('http') ? brand.logoFull : `${window.location.origin}${brand.logoFull}`}" alt="${brand.name} Logo" />
                                <h1>Baba Restaurant</h1>
                                <p>${escapeHtml(branch?.name ?? 'Main Branch')} • ${escapeHtml(branch?.address ?? 'Address not set')}</p>
                            </div>
                            <div class="header-right">
                                <p class="header-label">Document</p>
                                <p class="header-value"><strong>Cash / Bank Voucher</strong></p>
                                <p class="header-value"><strong>Created:</strong> ${escapeHtml(createdAt)}</p>
                            </div>
                        </div>
                        <div class="content">
                            <div class="grid">
                                <div class="box"><span class="label">Movement Date</span><span class="value">${escapeHtml(movementDate)}</span></div>
                                <div class="box"><span class="label">Movement Type</span><span class="value">${escapeHtml(movementType?.name ?? movement.movement_type)}</span></div>
                                <div class="box"><span class="label">Direction</span><span class="value">${escapeHtml(direction)}</span></div>
                            </div>
                            <div class="table-wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Source Account</th>
                                            <th>Counterparty</th>
                                            <th>Payment Method</th>
                                            <th class="right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>${escapeHtml(movement.account ? `${movement.account.code} - ${movement.account.name}` : '-')}</td>
                                            <td>${escapeHtml(movement.counterparty_account ? `${movement.counterparty_account.code} - ${movement.counterparty_account.name}` : '-')}</td>
                                            <td>${escapeHtml(paymentMethod)}</td>
                                            <td class="right">${escapeHtml(amount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="note-box">
                                <p class="note-title">Notes</p>
                                <p class="note-text">${escapeHtml(movement.description ?? '-')}</p>
                            </div>
                            <div class="summary">
                                <div class="summary-row"><span>Subtotal</span><span>${escapeHtml(amount)}</span></div>
                                <div class="summary-row total"><span>Total</span><span>${escapeHtml(amount)}</span></div>
                            </div>
                            <div class="signatures">
                                <div class="signature"><div class="signature-line">Prepared By</div></div>
                                <div class="signature"><div class="signature-line">Finance Manager</div></div>
                                <div class="signature"><div class="signature-line">Approved By</div></div>
                            </div>
                        </div>
                        <div class="footer">
                            <div class="footer-note">
                                Generated from the finance module for internal review, signature workflow, and restaurant cash and bank records.
                            </div>
                            <div class="footer-stamp">Baba Finance Copy</div>
                        </div>
                    </div>
                    <script>
                        window.onload = function () {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);

        printWindow.document.close();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5" />
                        Cash / Bank Voucher Print
                    </DialogTitle>
                    <DialogDescription>
                        Review this voucher, then print it for manager
                        signature.
                    </DialogDescription>
                </DialogHeader>

                {movement ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={printVoucher} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print Movement Voucher
                            </Button>
                        </div>
                        <ScrollArea className="h-[560px] rounded-lg border bg-slate-50 p-4">
                            <div className="mx-auto max-w-4xl bg-white p-8">
                                <div className="relative border-b pb-6">
                                    <div className="absolute top-0 left-0 text-sm">
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Voucher
                                        </p>
                                        <p className="mt-2 font-medium">
                                            No: CSH-{movement.id}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Date:{' '}
                                            {formatDateOnly(
                                                movement.movement_date,
                                            )}
                                        </p>
                                    </div>
                                    <div className="mx-auto max-w-sm text-center">
                                        <img
                                            src={brand.logoFull}
                                            alt="Baba Restaurant Logo"
                                            className="mx-auto mb-3 h-16 w-16 object-contain"
                                        />
                                        <p className="text-2xl font-semibold tracking-wide">
                                            Baba Restaurant
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {branch?.name ?? 'Main Branch'} •{' '}
                                            {branch?.address ??
                                                'Address not set'}
                                        </p>
                                    </div>
                                    <div className="absolute top-0 right-0 text-right text-sm">
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Document
                                        </p>
                                        <p className="mt-2 font-medium">
                                            Cash / Bank Voucher
                                        </p>
                                        <p className="text-muted-foreground">
                                            Created:{' '}
                                            {formatDateTime(
                                                movement.created_at,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Movement Date
                                        </p>
                                        <p className="font-medium">
                                            {formatDateOnly(
                                                movement.movement_date,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Movement Type
                                        </p>
                                        <p className="font-medium">
                                            {movementType?.name ??
                                                movement.movement_type}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Direction
                                        </p>
                                        <p className="font-medium capitalize">
                                            {movement.direction}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 border-y-2">
                                    <div className="grid grid-cols-12 border-b px-3 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        <div className="col-span-4">
                                            Source Account
                                        </div>
                                        <div className="col-span-3">
                                            Counterparty
                                        </div>
                                        <div className="col-span-2">Method</div>
                                        <div className="col-span-3 text-right">
                                            Amount
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-12 px-3 py-4 text-sm">
                                        <div className="col-span-4">
                                            {movement.account
                                                ? `${movement.account.code} - ${movement.account.name}`
                                                : '-'}
                                        </div>
                                        <div className="col-span-3">
                                            {movement.counterparty_account
                                                ? `${movement.counterparty_account.code} - ${movement.counterparty_account.name}`
                                                : '-'}
                                        </div>
                                        <div className="col-span-2">
                                            {(
                                                movement.payment_method ??
                                                'other'
                                            ).replaceAll('_', ' ')}
                                        </div>
                                        <div className="col-span-3 text-right font-semibold">
                                            {formatAfn(
                                                Number(movement.amount ?? 0),
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
                                    <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                                        Notes
                                    </p>
                                    <p className="mt-2 leading-7">
                                        {movement.description ?? '-'}
                                    </p>
                                </div>

                                <div className="mt-6 ml-auto w-full max-w-xs">
                                    <div className="flex items-center justify-between border-b py-3 text-sm">
                                        <span>Subtotal</span>
                                        <span>
                                            {formatAfn(
                                                Number(movement.amount ?? 0),
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b-2 border-black py-4 text-base font-semibold">
                                        <span>Total</span>
                                        <span className="font-semibold">
                                            {formatAfn(
                                                Number(movement.amount ?? 0),
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-20 grid grid-cols-3 gap-8 text-center text-xs tracking-[0.14em] text-muted-foreground uppercase">
                                    <div className="border-t pt-3">
                                        Prepared By
                                    </div>
                                    <div className="border-t pt-3">
                                        Finance Manager
                                    </div>
                                    <div className="border-t pt-3">
                                        Approved By
                                    </div>
                                </div>

                                <div className="mt-12 flex items-end justify-between border-t pt-6 text-xs text-muted-foreground">
                                    <p className="max-w-xl leading-6">
                                        Generated from the finance module for
                                        internal review, signature workflow, and
                                        restaurant cash and bank records.
                                    </p>
                                    <p className="tracking-[0.16em] uppercase">
                                        Baba Finance Copy
                                    </p>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
