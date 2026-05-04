import { PayrollRun } from '@/types';
import { formatAfghanMonthLabel } from '@/utils/afghan-calendar';
import { formatAfn, formatNumber } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function statusTone(status?: string) {
    if (status === 'paid' || status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    t: (key: string, fallback?: string) => string;
    onView: (run: PayrollRun) => void;
    onReviewApproval: (run: PayrollRun) => void;
    onMarkPaid: (run: PayrollRun) => void;
    onDelete: (run: PayrollRun) => void;
    canApprove: boolean;
    canPay: boolean;
    canDelete: boolean;
}

export function buildColumns({
    t,
    onView,
    onReviewApproval,
    onMarkPaid,
    onDelete,
    canApprove,
    canPay,
    canDelete,
}: BuildColumnsProps): ColumnDef<PayrollRun>[] {
    return [
        {
            id: 'period',
            accessorFn: (row) => `${row.period_start} ${row.period_end}`,
            header: t('financePayroll.table.period', 'Period'),
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.payroll_period_label ??
                            formatAfghanMonthLabel(row.original.period_end)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.period_start} to {row.original.period_end}{' '}
                        •{' '}
                        {row.original.branch?.name ??
                            t(
                                'financePayroll.filters.allBranches',
                                'All Branches',
                            )}
                    </p>
                </div>
            ),
        },
        {
            id: 'items_count',
            accessorFn: (row) => Number(row.items_count ?? 0),
            header: t('financePayroll.table.employees', 'Employees'),
            cell: ({ row }) => formatNumber(row.original.items_count ?? 0),
        },
        {
            id: 'gross_total',
            accessorFn: (row) => Number(row.gross_total ?? 0),
            header: t('financePayroll.table.gross', 'Gross'),
            cell: ({ row }) => formatAfn(row.original.gross_total ?? 0),
        },
        {
            id: 'advances_total',
            accessorFn: (row) => Number(row.advances_total ?? 0),
            header: t('financePayroll.table.advances', 'Advances'),
            cell: ({ row }) => formatAfn(row.original.advances_total ?? 0),
        },
        {
            id: 'net_total',
            accessorFn: (row) => Number(row.net_total ?? 0),
            header: t('financePayroll.table.netPayroll', 'Net Payroll'),
            cell: ({ row }) => (
                <p className="font-semibold">
                    {formatAfn(row.original.net_total ?? 0)}
                </p>
            ),
        },
        {
            id: 'status',
            accessorFn: (row) => row.status,
            header: t('financePayroll.table.status', 'Status'),
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                        row.original.status,
                    )}`}
                >
                    {t(
                        `financePayroll.statuses.${row.original.status}`,
                        row.original.status,
                    )}
                </span>
            ),
        },
        {
            id: 'actions',
            header: t('financePayroll.table.actions', 'Actions'),
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    onView={onView}
                    onReviewApproval={onReviewApproval}
                    onMarkPaid={onMarkPaid}
                    onDelete={onDelete}
                    canApprove={canApprove}
                    canPay={canPay}
                    canDelete={canDelete}
                />
            ),
        },
    ];
}
