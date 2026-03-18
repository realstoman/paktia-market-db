import { EmployeeContractPaymentSchedule } from '@/types';
import { formatAfn } from '@/utils/format';
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
    onEdit: (schedule: EmployeeContractPaymentSchedule) => void;
    onDelete: (schedule: EmployeeContractPaymentSchedule) => void;
    onPrint: (schedule: EmployeeContractPaymentSchedule) => void;
    onViewAttachment: (schedule: EmployeeContractPaymentSchedule) => void;
    onReviewApproval: (schedule: EmployeeContractPaymentSchedule) => void;
    canApprove: boolean;
}

export function buildColumns({
    onEdit,
    onDelete,
    onPrint,
    onViewAttachment,
    onReviewApproval,
    canApprove,
}: BuildColumnsProps): ColumnDef<EmployeeContractPaymentSchedule>[] {
    return [
        {
            id: 'employee_name',
            accessorFn: (row) =>
                row.contract?.employee?.full_name ||
                `${row.contract?.employee?.first_name ?? ''} ${row.contract?.employee?.last_name ?? ''}`.trim() ||
                `Employee #${row.contract?.employee_id ?? '-'}`,
            header: 'Employee',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.contract?.employee?.full_name ||
                            `${row.original.contract?.employee?.first_name ?? ''} ${row.original.contract?.employee?.last_name ?? ''}`.trim() ||
                            `Employee #${row.original.contract?.employee_id ?? '-'}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.contract?.branch?.name ?? 'All Branches'}
                    </p>
                </div>
            ),
        },
        {
            id: 'due_date',
            accessorFn: (row) => row.due_date,
            header: 'Due Date',
        },
        {
            id: 'title',
            accessorFn: (row) => row.title ?? '-',
            header: 'Title',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.title ?? 'Contract Schedule'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.contract?.payment_plan_type?.replaceAll(
                            '_',
                            ' ',
                        ) ?? '-'}
                    </p>
                </div>
            ),
        },
        {
            id: 'percentage',
            accessorFn: (row) => Number(row.percentage ?? 0),
            header: '%',
            cell: ({ row }) =>
                row.original.percentage != null
                    ? `${row.original.percentage}%`
                    : '-',
        },
        {
            id: 'amount',
            accessorFn: (row) => Number(row.amount ?? 0),
            header: 'Amount',
            cell: ({ row }) => formatAfn(row.original.amount),
        },
        {
            id: 'attachment',
            accessorFn: (row) => row.attachment_path ?? '',
            header: 'Attachment',
            cell: ({ row }) =>
                row.original.attachment_path ? (
                    <button
                        type="button"
                        onClick={() => onViewAttachment(row.original)}
                        className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
                    >
                        View
                    </button>
                ) : (
                    <span className="text-sm text-muted-foreground">
                        No file
                    </span>
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
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPrint={onPrint}
                    onReviewApproval={onReviewApproval}
                    canApprove={canApprove}
                />
            ),
        },
    ];
}
