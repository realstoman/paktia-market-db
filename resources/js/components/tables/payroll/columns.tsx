import { PayrollRun } from '@/types';
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
    onView: (run: PayrollRun) => void;
    onApprove: (run: PayrollRun) => void;
    onMarkPaid: (run: PayrollRun) => void;
}

export function buildColumns({
    onView,
    onApprove,
    onMarkPaid,
}: BuildColumnsProps): ColumnDef<PayrollRun>[] {
    return [
        {
            id: 'period',
            accessorFn: (row) => `${row.period_start} ${row.period_end}`,
            header: 'Period',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.period_start} to {row.original.period_end}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.branch?.name ?? 'All Branches'}
                    </p>
                </div>
            ),
        },
        {
            id: 'items_count',
            accessorFn: (row) => Number(row.items_count ?? 0),
            header: 'Employees',
            cell: ({ row }) => formatNumber(row.original.items_count ?? 0),
        },
        {
            id: 'gross_total',
            accessorFn: (row) => Number(row.gross_total ?? 0),
            header: 'Gross',
            cell: ({ row }) => formatAfn(row.original.gross_total ?? 0),
        },
        {
            id: 'advances_total',
            accessorFn: (row) => Number(row.advances_total ?? 0),
            header: 'Advances',
            cell: ({ row }) => formatAfn(row.original.advances_total ?? 0),
        },
        {
            id: 'net_total',
            accessorFn: (row) => Number(row.net_total ?? 0),
            header: 'Net Payroll',
            cell: ({ row }) => (
                <p className="font-semibold">{formatAfn(row.original.net_total ?? 0)}</p>
            ),
        },
        {
            id: 'status',
            accessorFn: (row) => row.status,
            header: 'Status',
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                        row.original.status,
                    )}`}
                >
                    {row.original.status}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    onView={onView}
                    onApprove={onApprove}
                    onMarkPaid={onMarkPaid}
                />
            ),
        },
    ];
}
