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
        const approvalStatus = (movement.approval_status ?? 'draft')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        printWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(voucherNo)} - Cash/Bank Voucher</title>
                    <style>
                        @page { size: A4 portrait; margin: 14mm; }
                        body { margin: 0; color: #0f172a; font-family: "Segoe UI", Tahoma, sans-serif; background: #f8fafc; }
                        .sheet { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
                        .header { padding: 22px 26px; background: linear-gradient(135deg, #ecfeff, #ffffff); border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 14px; }
                        .brand h1 { margin: 0; font-size: 20px; letter-spacing: .2px; }
                        .brand p { margin: 5px 0 0; font-size: 12px; color: #475569; }
                        .meta { text-align: right; }
                        .pill { display: inline-block; background: #0f172a; color: #fff; border-radius: 999px; padding: 4px 10px; font-size: 11px; margin-bottom: 8px; }
                        .meta p { margin: 3px 0; font-size: 12px; color: #334155; }
                        .content { padding: 22px 26px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
                        .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
                        .label { display: block; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
                        .value { font-size: 14px; font-weight: 600; color: #0f172a; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        .table th { text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding: 8px 6px; }
                        .table td { font-size: 13px; padding: 11px 6px; border-bottom: 1px solid #e2e8f0; }
                        .table td.right { text-align: right; }
                        .total { margin-top: 16px; margin-left: auto; width: 280px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; }
                        .total-row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
                        .total-row strong { font-size: 16px; }
                        .footer { border-top: 1px solid #e2e8f0; padding: 20px 26px 24px; }
                        .sign { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-top: 22px; }
                        .line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; color: #475569; text-align: center; }
                        .note { color: #64748b; font-size: 11px; margin-top: 8px; }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="header">
                            <div class="brand">
                                <h1>Baba Restaurant</h1>
                                <p>${escapeHtml(branch?.name ?? 'Main Branch')} • ${escapeHtml(branch?.address ?? 'Address not set')}</p>
                            </div>
                            <div class="meta">
                                <span class="pill">Cash / Bank Voucher</span>
                                <p><strong>No:</strong> ${escapeHtml(voucherNo)}</p>
                                <p><strong>Created:</strong> ${escapeHtml(createdAt)}</p>
                            </div>
                        </div>
                        <div class="content">
                            <div class="grid">
                                <div class="box"><span class="label">Movement Date</span><span class="value">${escapeHtml(movementDate)}</span></div>
                                <div class="box"><span class="label">Status</span><span class="value">${escapeHtml(approvalStatus)}</span></div>
                                <div class="box"><span class="label">Movement Type</span><span class="value">${escapeHtml(movementType?.name ?? movement.movement_type)}</span></div>
                                <div class="box"><span class="label">Direction</span><span class="value">${escapeHtml(direction)}</span></div>
                            </div>
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
                            <div class="total">
                                <div class="total-row"><span>Total</span><strong>${escapeHtml(amount)}</strong></div>
                            </div>
                        </div>
                        <div class="footer">
                            <div><strong>Notes:</strong> ${escapeHtml(movement.description ?? '-')}</div>
                            <div class="sign">
                                <div class="line">Prepared By</div>
                                <div class="line">Finance Manager</div>
                                <div class="line">Approved By</div>
                            </div>
                            <p class="note">Generated from Finance module for internal control and signature workflow.</p>
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
                        Review this voucher, then print it for manager signature.
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
                            <div className="mx-auto max-w-3xl rounded-xl border bg-white p-6">
                                <div className="mb-4 flex items-start justify-between border-b pb-4">
                                    <div>
                                        <p className="text-xl font-semibold">Baba Restaurant</p>
                                        <p className="text-sm text-muted-foreground">
                                            {branch?.name ?? 'Main Branch'} • {branch?.address ?? 'Address not set'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Cash / Bank Voucher
                                        </p>
                                        <p className="font-medium">CSH-{movement.id}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-md border p-3">
                                        <p className="text-xs text-muted-foreground">Movement Date</p>
                                        <p className="font-medium">{formatDateOnly(movement.movement_date)}</p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <p className="font-medium capitalize">{movement.approval_status ?? 'draft'}</p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-xs text-muted-foreground">Movement Type</p>
                                        <p className="font-medium">{movementType?.name ?? movement.movement_type}</p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-xs text-muted-foreground">Direction</p>
                                        <p className="font-medium capitalize">{movement.direction}</p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-md border">
                                    <div className="grid grid-cols-12 border-b bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <div className="col-span-4">Source Account</div>
                                        <div className="col-span-3">Counterparty</div>
                                        <div className="col-span-2">Method</div>
                                        <div className="col-span-3 text-right">Amount</div>
                                    </div>
                                    <div className="grid grid-cols-12 px-3 py-3 text-sm">
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
                                            {(movement.payment_method ?? 'other').replaceAll('_', ' ')}
                                        </div>
                                        <div className="col-span-3 text-right font-semibold">
                                            {formatAfn(Number(movement.amount ?? 0))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 ml-auto w-full max-w-xs rounded-md border p-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Total</span>
                                        <span className="font-semibold">
                                            {formatAfn(Number(movement.amount ?? 0))}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 text-sm">
                                    <p>
                                        <span className="font-medium">Notes: </span>
                                        {movement.description ?? '-'}
                                    </p>
                                </div>

                                <div className="mt-10 grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                                    <div className="border-t pt-2">Prepared By</div>
                                    <div className="border-t pt-2">Finance Manager</div>
                                    <div className="border-t pt-2">Approved By</div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
