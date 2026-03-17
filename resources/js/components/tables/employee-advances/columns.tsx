import { EmployeeAdvance } from '@/types';
import { formatAfn } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function shortDate(value?: string | null) {
    if (!value) {
        return '-';
    }

    return value.includes('T') ? value.split('T')[0] : value;
}

function statusTone(status?: string) {
    if (status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    onEdit: (advance: EmployeeAdvance) => void;
    onApprove: (advance: EmployeeAdvance) => void;
    onReject: (advance: EmployeeAdvance) => void;
    onPrint: (advance: EmployeeAdvance) => void;
}

export function buildColumns({
    onEdit,
    onApprove,
    onReject,
    onPrint,
}: BuildColumnsProps): ColumnDef<EmployeeAdvance>[] {
    return [
        {
            id: 'employee_name',
            accessorFn: (row) =>
                row.employee?.full_name ||
                `${row.employee?.first_name ?? ''} ${row.employee?.last_name ?? ''}`.trim() ||
                `Employee #${row.employee_id}`,
            header: 'Employee',
            cell: ({ row }) => {
                const employeeName =
                    row.original.employee?.full_name ||
                    `${row.original.employee?.first_name ?? ''} ${row.original.employee?.last_name ?? ''}`.trim() ||
                    `Employee #${row.original.employee_id}`;

                return (
                    <div>
                        <p className="font-medium">{employeeName}</p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.branch?.name ?? 'All Branches'}
                        </p>
                    </div>
                );
            },
        },
        {
            id: 'advance_date',
            accessorFn: (row) => shortDate(row.advance_date),
            header: 'Date',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{shortDate(row.original.advance_date)}</p>
                </div>
            ),
        },
        {
            id: 'reason',
            accessorFn: (row) => row.reason ?? '-',
            header: 'Reason',
            cell: ({ row }) => (
                <p className="max-w-[260px] truncate text-sm text-muted-foreground">
                    {row.original.reason ?? '-'}
                </p>
            ),
        },
        {
            id: 'amount',
            accessorFn: (row) => Number(row.amount ?? 0),
            header: 'Amount',
            cell: ({ row }) => formatAfn(row.original.amount),
        },
        {
            id: 'deducted_amount',
            accessorFn: (row) => Number(row.deducted_amount ?? 0),
            header: 'Deducted',
            cell: ({ row }) => formatAfn(row.original.deducted_amount ?? 0),
        },
        {
            id: 'remaining_balance',
            accessorFn: (row) => Number(row.remaining_balance ?? 0),
            header: 'Remaining',
            cell: ({ row }) => formatAfn(row.original.remaining_balance ?? 0),
        },
        {
            id: 'repayment_method',
            accessorFn: (row) => row.repayment_method ?? '-',
            header: 'Repayment Method',
            cell: ({ row }) =>
                row.original.repayment_method
                    ? row.original.repayment_method.replaceAll('_', ' ')
                    : '-',
        },
        {
            id: 'status',
            accessorFn: (row) => row.status ?? 'draft',
            header: 'Status',
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                        row.original.status,
                    )}`}
                >
                    {row.original.status ?? 'draft'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    onEdit={onEdit}
                    onApprove={onApprove}
                    onReject={onReject}
                    onPrint={onPrint}
                />
            ),
        },
    ];
}
