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
import { Branch, EmployeeContractPaymentSchedule } from '@/types';
import { formatAfn } from '@/utils/format';
import { Printer, ReceiptText } from 'lucide-react';

interface ContractPaymentVoucherPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schedule: EmployeeContractPaymentSchedule | null;
    branch: Branch | null;
}

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

function employeeName(schedule: EmployeeContractPaymentSchedule) {
    return (
        schedule.contract?.employee?.full_name ||
        `${schedule.contract?.employee?.first_name ?? ''} ${schedule.contract?.employee?.last_name ?? ''}`.trim() ||
        `Employee #${schedule.contract?.employee_id ?? '-'}`
    );
}

export function ContractPaymentVoucherPrintDialog({
    open,
    onOpenChange,
    schedule,
    branch,
}: ContractPaymentVoucherPrintDialogProps) {
    const printVoucher = () => {
        if (!schedule) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=960,height=1100');
        if (!printWindow) {
            return;
        }

        const voucherNo = `SCH-${schedule.id}`;
        const employee = employeeName(schedule);
        const amount = formatAfn(schedule.amount);
        const title = schedule.title ?? 'Contract payment schedule';
        const paymentMethod = schedule.payment_method
            ? schedule.payment_method.replaceAll('_', ' ')
            : 'bank transfer';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(voucherNo)} - Contract Payment Voucher</title>
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
                        .summary { margin-top: 24px; width: 320px; margin-left: auto; }
                        .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dbe4ee; font-size: 14px; }
                        .summary-row.total { font-size: 18px; font-weight: 700; border-bottom: 2px solid #0f172a; padding-top: 16px; }
                        .signatures { margin-top: 72px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 28px; }
                        .signature { text-align: center; }
                        .signature-line { border-top: 1px solid #64748b; padding-top: 10px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #475569; }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="header">
                            <div class="header-left">
                                <p class="header-label">Schedule</p>
                                <p class="header-value"><strong>No:</strong> ${escapeHtml(voucherNo)}</p>
                                <p class="header-value"><strong>Due Date:</strong> ${escapeHtml(schedule.due_date ?? '-')}</p>
                            </div>
                            <div class="brand">
                                <img src="${brand.logoFull.startsWith('http') ? brand.logoFull : `${window.location.origin}${brand.logoFull}`}" alt="${brand.name} Logo" />
                                <h1>Baba Restaurant</h1>
                                <p>${escapeHtml(branch?.name ?? 'Main Branch')} • ${escapeHtml(branch?.address ?? 'Address not set')}</p>
                            </div>
                            <div class="header-right">
                                <p class="header-label">Document</p>
                                <p class="header-value"><strong>Contract Payment Voucher</strong></p>
                                <p class="header-value"><strong>Status:</strong> ${escapeHtml(schedule.status)}</p>
                            </div>
                        </div>
                        <div class="content">
                            <div class="grid">
                                <div class="box"><span class="label">Employee</span><span class="value">${escapeHtml(employee)}</span></div>
                                <div class="box"><span class="label">Title</span><span class="value">${escapeHtml(title)}</span></div>
                                <div class="box"><span class="label">Payment Method</span><span class="value">${escapeHtml(paymentMethod)}</span></div>
                            </div>
                            <div class="table-wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Due Date</th>
                                            <th class="right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>${escapeHtml(title)}</td>
                                            <td>${escapeHtml(schedule.due_date ?? '-')}</td>
                                            <td class="right">${escapeHtml(amount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="summary">
                                <div class="summary-row"><span>Schedule Amount</span><span>${escapeHtml(amount)}</span></div>
                                <div class="summary-row total"><span>Payable</span><span>${escapeHtml(amount)}</span></div>
                            </div>
                            <div class="signatures">
                                <div class="signature"><div class="signature-line">Prepared By</div></div>
                                <div class="signature"><div class="signature-line">Finance Manager</div></div>
                                <div class="signature"><div class="signature-line">Approved By</div></div>
                            </div>
                        </div>
                    </div>
                    <script>window.onload = function () { window.print(); };</script>
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
                        Contract Payment Voucher Print
                    </DialogTitle>
                    <DialogDescription>
                        Review and print this individual contract payment
                        schedule voucher.
                    </DialogDescription>
                </DialogHeader>

                {schedule ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={printVoucher} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print Contract Voucher
                            </Button>
                        </div>
                        <ScrollArea className="h-[560px] rounded-lg border bg-slate-50 p-4">
                            <div className="mx-auto max-w-4xl bg-white p-8">
                                <div className="relative border-b pb-6">
                                    <div className="absolute top-0 left-0 text-sm">
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Schedule
                                        </p>
                                        <p className="mt-2 font-medium">
                                            No: SCH-{schedule.id}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Due Date: {schedule.due_date}
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
                                </div>
                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Employee
                                        </p>
                                        <p className="font-medium">
                                            {employeeName(schedule)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Title
                                        </p>
                                        <p className="font-medium">
                                            {schedule.title ??
                                                'Contract payment schedule'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Amount
                                        </p>
                                        <p className="font-medium">
                                            {formatAfn(schedule.amount)}
                                        </p>
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
