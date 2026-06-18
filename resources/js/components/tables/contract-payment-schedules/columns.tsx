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
    t: (key: string, fallback?: string) => string;
    onEdit: (schedule: EmployeeContractPaymentSchedule) => void;
    onDelete: (schedule: EmployeeContractPaymentSchedule) => void;
    onPrint: (schedule: EmployeeContractPaymentSchedule) => void;
    onViewAttachment: (schedule: EmployeeContractPaymentSchedule) => void;
    onReviewApproval: (schedule: EmployeeContractPaymentSchedule) => void;
    canApprove: boolean;
    canDelete: boolean;
}

export function buildColumns({
    t,
    onEdit,
    onDelete,
    onPrint,
    onViewAttachment,
    onReviewApproval,
    canApprove,
    canDelete,
}: BuildColumnsProps): ColumnDef<EmployeeContractPaymentSchedule>[] {
    return [
        {
            id: 'employee_name',
            accessorFn: (row) =>
                row.contract?.employee?.full_name ||
                `${row.contract?.employee?.first_name ?? ''} ${row.contract?.employee?.last_name ?? ''}`.trim() ||
                `Employee #${row.contract?.employee_id ?? '-'}`,
            header: t('financePayroll.scheduleTable.employee', 'Employee'),
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.contract?.employee?.full_name ||
                            `${row.original.contract?.employee?.first_name ?? ''} ${row.original.contract?.employee?.last_name ?? ''}`.trim() ||
                            `Employee #${row.original.contract?.employee_id ?? '-'}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.contract?.property?.name ??
                            t(
                                'financePayroll.filters.allProperties',
                                'All Properties',
                            )}
                    </p>
                </div>
            ),
        },
        {
            id: 'due_date',
            accessorFn: (row) => row.due_date,
            header: t('financePayroll.scheduleTable.dueDate', 'Due Date'),
        },
        {
            id: 'title',
            accessorFn: (row) => row.title ?? '-',
            header: t('financePayroll.scheduleTable.title', 'Title'),
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.title ??
                            t(
                                'financePayroll.scheduleTable.contractSchedule',
                                'Contract Schedule',
                            )}
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
            header: t('financePayroll.scheduleTable.amount', 'Amount'),
            cell: ({ row }) => formatAfn(row.original.amount),
        },
        {
            id: 'attachment',
            accessorFn: (row) => row.attachment_path ?? '',
            header: t('financePayroll.scheduleTable.attachment', 'Attachment'),
            cell: ({ row }) =>
                row.original.attachment_path ? (
                    <button
                        type="button"
                        onClick={() => onViewAttachment(row.original)}
                        className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
                    >
                        {t('financePayroll.scheduleTable.view', 'View')}
                    </button>
                ) : (
                    <span className="text-sm text-muted-foreground">
                        {t('financePayroll.scheduleTable.noFile', 'No file')}
                    </span>
                ),
        },
        {
            id: 'status',
            accessorFn: (row) => row.status,
            header: t('financePayroll.scheduleTable.status', 'Status'),
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
            header: t('financePayroll.scheduleTable.actions', 'Actions'),
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPrint={onPrint}
                    onReviewApproval={onReviewApproval}
                    canApprove={canApprove}
                    canDelete={canDelete}
                />
            ),
        },
    ];
}
