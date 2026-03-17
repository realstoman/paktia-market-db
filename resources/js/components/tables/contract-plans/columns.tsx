import { EmployeeContract } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function statusTone(status?: string) {
    if (status === 'active' || status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    onEdit: (contract: EmployeeContract) => void;
    onDelete: (contract: EmployeeContract) => void;
    onPrint: (contract: EmployeeContract) => void;
}

export function buildColumns({
    onEdit,
    onDelete,
    onPrint,
}: BuildColumnsProps): ColumnDef<EmployeeContract>[] {
    return [
        {
            id: 'employee_name',
            accessorFn: (row) =>
                row.employee?.full_name ||
                `${row.employee?.first_name ?? ''} ${row.employee?.last_name ?? ''}`.trim() ||
                `Employee #${row.employee_id}`,
            header: 'Employee',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.employee?.full_name ||
                            `${row.original.employee?.first_name ?? ''} ${row.original.employee?.last_name ?? ''}`.trim() ||
                            `Employee #${row.original.employee_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.branch?.name ?? 'All Branches'}
                    </p>
                </div>
            ),
        },
        {
            id: 'period',
            accessorFn: (row) => `${row.start_date} ${row.end_date ?? ''}`,
            header: 'Period',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.start_date}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.end_date ?? 'Open ended'}
                    </p>
                </div>
            ),
        },
        {
            id: 'payment_plan_type',
            accessorFn: (row) => row.payment_plan_type,
            header: 'Plan Type',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.payment_plan_type.replaceAll('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.installment_count
                            ? `${formatNumber(row.original.installment_count)} installments`
                            : 'Custom count'}
                    </p>
                </div>
            ),
        },
        {
            id: 'contract_amount',
            accessorFn: (row) => Number(row.contract_amount ?? 0),
            header: 'Contract Amount',
            cell: ({ row }) => formatAfn(row.original.contract_amount),
        },
        {
            id: 'schedule_count',
            accessorFn: (row) => Number(row.schedules?.length ?? 0),
            header: 'Schedules',
            cell: ({ row }) => formatNumber(row.original.schedules?.length ?? 0),
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
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPrint={onPrint}
                />
            ),
        },
    ];
}
