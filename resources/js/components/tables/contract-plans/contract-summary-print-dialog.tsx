import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Branch, EmployeeContract } from '@/types';
import { formatAfn } from '@/utils/format';
import { Printer, ReceiptText } from 'lucide-react';

interface ContractSummaryPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract: EmployeeContract | null;
    branch: Branch | null;
}

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

function employeeName(contract: EmployeeContract) {
    return (
        contract.employee?.full_name ||
        `${contract.employee?.first_name ?? ''} ${contract.employee?.last_name ?? ''}`.trim() ||
        `Employee #${contract.employee_id}`
    );
}

export function ContractSummaryPrintDialog({
    open,
    onOpenChange,
    contract,
    branch,
}: ContractSummaryPrintDialogProps) {
    const printVoucher = () => {
        if (!contract) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=960,height=1100');
        if (!printWindow) {
            return;
        }

        const voucherNo = `CON-${contract.id}`;
        const employee = employeeName(contract);
        const planType = contract.payment_plan_type.replaceAll('_', ' ');
        const schedules = contract.schedules ?? [];
        const rows = schedules
            .map(
                (schedule) => `
                    <tr>
                        <td>${escapeHtml(schedule.title ?? 'Schedule')}</td>
                        <td>${escapeHtml(schedule.due_date ?? '-')}</td>
                        <td>${escapeHtml(
                            schedule.percentage != null
                                ? `${schedule.percentage}%`
                                : '-',
                        )}</td>
                        <td class="right">${escapeHtml(formatAfn(schedule.amount))}</td>
                        <td>${escapeHtml(schedule.status)}</td>
                    </tr>
                `,
            )
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(voucherNo)} - Contract Summary</title>
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
                        .signatures { margin-top: 72px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 28px; }
                        .signature { text-align: center; }
                        .signature-line { border-top: 1px solid #64748b; padding-top: 10px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #475569; }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="header">
                            <div class="header-left">
                                <p class="header-label">Plan</p>
                                <p class="header-value"><strong>No:</strong> ${escapeHtml(voucherNo)}</p>
                                <p class="header-value"><strong>Status:</strong> ${escapeHtml(contract.status)}</p>
                            </div>
                            <div class="brand">
                                <img src="${window.location.origin}/brand/logo.png" alt="Baba Restaurant Logo" />
                                <h1>Baba Restaurant</h1>
                                <p>${escapeHtml(branch?.name ?? 'Main Branch')} • ${escapeHtml(branch?.address ?? 'Address not set')}</p>
                            </div>
                            <div class="header-right">
                                <p class="header-label">Document</p>
                                <p class="header-value"><strong>Contract Payment Plan</strong></p>
                                <p class="header-value"><strong>Period:</strong> ${escapeHtml(contract.start_date)} to ${escapeHtml(contract.end_date ?? 'Open ended')}</p>
                            </div>
                        </div>
                        <div class="content">
                            <div class="grid">
                                <div class="box"><span class="label">Employee</span><span class="value">${escapeHtml(employee)}</span></div>
                                <div class="box"><span class="label">Plan Type</span><span class="value">${escapeHtml(planType)}</span></div>
                                <div class="box"><span class="label">Contract Amount</span><span class="value">${escapeHtml(formatAfn(contract.contract_amount))}</span></div>
                            </div>
                            <div class="table-wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Schedule</th>
                                            <th>Due Date</th>
                                            <th>%</th>
                                            <th class="right">Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rows || '<tr><td colspan="5">No schedules added yet.</td></tr>'}
                                    </tbody>
                                </table>
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
                        Contract Plan Summary Print
                    </DialogTitle>
                    <DialogDescription>
                        Review and print the contract payment plan summary with
                        all schedule rows.
                    </DialogDescription>
                </DialogHeader>

                {contract ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={printVoucher} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print Contract Summary
                            </Button>
                        </div>
                        <ScrollArea className="h-[560px] rounded-lg border bg-slate-50 p-4">
                            <div className="mx-auto max-w-4xl bg-white p-8">
                                <div className="relative border-b pb-6">
                                    <div className="absolute top-0 left-0 text-sm">
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Plan
                                        </p>
                                        <p className="mt-2 font-medium">
                                            No: CON-{contract.id}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Status: {contract.status}
                                        </p>
                                    </div>
                                    <div className="mx-auto max-w-sm text-center">
                                        <img
                                            src="/brand/logo.png"
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
                                            {employeeName(contract)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Plan Type
                                        </p>
                                        <p className="font-medium">
                                            {contract.payment_plan_type.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Contract Amount
                                        </p>
                                        <p className="font-medium">
                                            {formatAfn(
                                                contract.contract_amount,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 overflow-hidden border-y-2">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-2 py-3 text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    Schedule
                                                </th>
                                                <th className="px-2 py-3 text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    Due Date
                                                </th>
                                                <th className="px-2 py-3 text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    %
                                                </th>
                                                <th className="px-2 py-3 text-right text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    Amount
                                                </th>
                                                <th className="px-2 py-3 text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(contract.schedules ?? []).length >
                                            0 ? (
                                                (contract.schedules ?? []).map(
                                                    (schedule) => (
                                                        <tr key={schedule.id}>
                                                            <td className="px-2 py-4">
                                                                {schedule.title ??
                                                                    'Schedule'}
                                                            </td>
                                                            <td className="px-2 py-4">
                                                                {
                                                                    schedule.due_date
                                                                }
                                                            </td>
                                                            <td className="px-2 py-4">
                                                                {schedule.percentage !=
                                                                null
                                                                    ? `${schedule.percentage}%`
                                                                    : '-'}
                                                            </td>
                                                            <td className="px-2 py-4 text-right">
                                                                {formatAfn(
                                                                    schedule.amount,
                                                                )}
                                                            </td>
                                                            <td className="px-2 py-4">
                                                                {
                                                                    schedule.status
                                                                }
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        className="px-2 py-4"
                                                        colSpan={5}
                                                    >
                                                        No schedules added yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
