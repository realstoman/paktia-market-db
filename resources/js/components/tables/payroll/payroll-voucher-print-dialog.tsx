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
import { Branch, PayrollRun, PayrollRunItem } from '@/types';
import { formatAfn } from '@/utils/format';
import { Printer, ReceiptText } from 'lucide-react';

interface PayrollVoucherPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    run: PayrollRun | null;
    item: PayrollRunItem | null;
    branch: Branch | null;
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

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

function employeeName(item: PayrollRunItem) {
    return (
        item.employee?.full_name ||
        `${item.employee?.first_name ?? ''} ${item.employee?.last_name ?? ''}`.trim() ||
        `Employee #${item.employee_id}`
    );
}

function salaryTypeLabel(value?: string | null) {
    return value
        ? value
              .replaceAll('_', ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase())
        : '-';
}

function paymentMethodLabel(value?: string | null) {
    return value
        ? value
              .replaceAll('_', ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase())
        : '-';
}

export function PayrollVoucherPrintDialog({
    open,
    onOpenChange,
    run,
    item,
    branch,
}: PayrollVoucherPrintDialogProps) {
    const printVoucher = () => {
        if (!run || !item) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=960,height=1100');
        if (!printWindow) {
            return;
        }

        const voucherNo = `PAY-${run.id}-${item.id}`;
        const employee = employeeName(item);
        const salaryType = salaryTypeLabel(item.salary_type);
        const paymentMethod = paymentMethodLabel(item.payment_method);
        const gross = formatAfn(Number(item.gross_salary ?? 0));
        const advances = formatAfn(Number(item.advances_deducted ?? 0));
        const net = formatAfn(Number(item.net_salary ?? 0));
        const createdAt = formatDateTime(run.created_at);
        const period = `${run.period_start} to ${run.period_end}`;
        const title =
            item.salary_type === 'contract_payment'
                ? 'Contract Payment Voucher'
                : 'Salary Payment Voucher';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(voucherNo)} - ${escapeHtml(title)}</title>
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
                        .summary { margin-top: 24px; width: 320px; margin-left: auto; }
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
                                <p class="header-value"><strong>Period:</strong> ${escapeHtml(period)}</p>
                            </div>
                            <div class="brand">
                                <img src="${brand.logoFull.startsWith('http') ? brand.logoFull : `${window.location.origin}${brand.logoFull}`}" alt="${brand.name} Logo" />
                                <h1>Baba Restaurant</h1>
                                <p>${escapeHtml(branch?.name ?? 'Main Branch')} • ${escapeHtml(branch?.address ?? 'Address not set')}</p>
                            </div>
                            <div class="header-right">
                                <p class="header-label">Document</p>
                                <p class="header-value"><strong>${escapeHtml(title)}</strong></p>
                                <p class="header-value"><strong>Created:</strong> ${escapeHtml(createdAt)}</p>
                            </div>
                        </div>
                        <div class="content">
                            <div class="grid">
                                <div class="box"><span class="label">Employee</span><span class="value">${escapeHtml(employee)}</span></div>
                                <div class="box"><span class="label">Salary Type</span><span class="value">${escapeHtml(salaryType)}</span></div>
                                <div class="box"><span class="label">Payment Method</span><span class="value">${escapeHtml(paymentMethod)}</span></div>
                            </div>
                            <div class="table-wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Branch</th>
                                            <th class="right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>${escapeHtml(title)} for ${escapeHtml(period)}</td>
                                            <td>${escapeHtml(branch?.name ?? 'All Branches')}</td>
                                            <td class="right">${escapeHtml(net)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="note-box">
                                <p class="note-title">Notes</p>
                                <p class="note-text">This voucher is prepared for review before salary payout approval. It shows the planned payment amount and any advance deduction for the selected payroll period.</p>
                            </div>
                            <div class="summary">
                                <div class="summary-row"><span>Gross Pay</span><span>${escapeHtml(gross)}</span></div>
                                <div class="summary-row"><span>Advance Deduction</span><span>${escapeHtml(advances)}</span></div>
                                <div class="summary-row total"><span>Net Payable</span><span>${escapeHtml(net)}</span></div>
                            </div>
                            <div class="signatures">
                                <div class="signature"><div class="signature-line">Prepared By</div></div>
                                <div class="signature"><div class="signature-line">Finance Manager</div></div>
                                <div class="signature"><div class="signature-line">Approved By</div></div>
                            </div>
                        </div>
                        <div class="footer">
                            <div class="footer-note">
                                Generated from the payroll module for internal review, signature workflow, and staff payment records.
                            </div>
                            <div class="footer-stamp">Baba Payroll Copy</div>
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
                        Payroll Voucher Print
                    </DialogTitle>
                    <DialogDescription>
                        Review this payroll voucher, then print it for manager
                        review and salary payment approval.
                    </DialogDescription>
                </DialogHeader>

                {run && item ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={printVoucher} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print Payroll Voucher
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
                                            No: PAY-{run.id}-{item.id}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Period: {run.period_start} to{' '}
                                            {run.period_end}
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
                                            {item.salary_type ===
                                            'contract_payment'
                                                ? 'Contract Payment Voucher'
                                                : 'Salary Payment Voucher'}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Created:{' '}
                                            {formatDateTime(run.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Employee
                                        </p>
                                        <p className="font-medium">
                                            {employeeName(item)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Salary Type
                                        </p>
                                        <p className="font-medium">
                                            {salaryTypeLabel(item.salary_type)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Payment Method
                                        </p>
                                        <p className="font-medium">
                                            {paymentMethodLabel(
                                                item.payment_method,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 overflow-hidden border-y-2">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-2 py-3 text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    Description
                                                </th>
                                                <th className="px-2 py-3 text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    Branch
                                                </th>
                                                <th className="px-2 py-3 text-right text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="px-2 py-4">
                                                    {item.salary_type ===
                                                    'contract_payment'
                                                        ? 'Contract payment voucher'
                                                        : 'Salary payment voucher'}{' '}
                                                    for {run.period_start} to{' '}
                                                    {run.period_end}
                                                </td>
                                                <td className="px-2 py-4">
                                                    {branch?.name ??
                                                        'All Branches'}
                                                </td>
                                                <td className="px-2 py-4 text-right">
                                                    {formatAfn(item.net_salary)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                        Notes
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700">
                                        Prepared for salary payment review
                                        before manager approval. Advance
                                        deductions are already reflected in the
                                        net payable amount.
                                    </p>
                                </div>

                                <div className="mt-6 ml-auto w-full max-w-sm space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2 text-sm">
                                        <span>Gross Pay</span>
                                        <span>
                                            {formatAfn(item.gross_salary)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b pb-2 text-sm">
                                        <span>Advance Deduction</span>
                                        <span>
                                            {formatAfn(item.advances_deducted)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 text-lg font-semibold">
                                        <span>Net Payable</span>
                                        <span>
                                            {formatAfn(item.net_salary)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-18 grid gap-6 pt-12 md:grid-cols-3">
                                    <div className="text-center">
                                        <div className="border-t pt-3 text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                            Prepared By
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-t pt-3 text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                            Finance Manager
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-t pt-3 text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                            Approved By
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
