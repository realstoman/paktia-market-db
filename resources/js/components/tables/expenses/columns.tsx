import { Expense } from '@/types';
import { formatAfn } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function formatExpenseDate(value?: string) {
    if (!value) {
        return '-';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toISOString().slice(0, 10);
}

function formatExpenseTime(value?: string) {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(parsed);
}

function badgeTone(status?: string) {
    if (status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'cancelled') {
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200';
    }

    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    onEdit: (expense: Expense) => void;
    onApprove: (expense: Expense) => void;
    onCancel: (expense: Expense) => void;
    onViewAttachment: (path: string) => void;
    onPrint: (expense: Expense) => void;
}

export function buildColumns({
    onEdit,
    onApprove,
    onCancel,
    onViewAttachment,
    onPrint,
}: BuildColumnsProps): ColumnDef<Expense>[] {
    return [
        {
            accessorKey: 'expense_date',
            header: 'Date',
            cell: ({ row }) => {
                const dateText = formatExpenseDate(row.original.expense_date);
                const timeText = formatExpenseTime(row.original.created_at);

                return (
                    <div>
                        <p className="font-medium">{dateText}</p>
                        {timeText ? (
                            <p className="text-xs text-muted-foreground">
                                {timeText}
                            </p>
                        ) : null}
                    </div>
                );
            },
        },
        {
            id: 'title',
            accessorKey: 'title',
            header: 'Title',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.title}</p>
                    {row.original.description ? (
                        <p className="text-xs text-muted-foreground">
                            {row.original.description}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'branch.name',
            accessorFn: (row) => row.branch?.name ?? '-',
            header: 'Branch',
        },
        {
            id: 'expense_category.name',
            accessorFn: (row) =>
                row.expense_category?.name ?? row.expense_type ?? '-',
            header: 'Category',
        },
        {
            accessorKey: 'payment_method',
            header: 'Payment Method',
            cell: ({ row }) =>
                row.original.payment_method
                    ? row.original.payment_method.replaceAll('_', ' ')
                    : '-',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => formatAfn(row.original.amount),
        },
        {
            id: 'attachment',
            header: 'Attachment',
            cell: ({ row }) => {
                const attachmentPath = row.original.attachments?.[0];

                if (!attachmentPath) {
                    return <span className="text-muted-foreground">-</span>;
                }

                return (
                    <button
                        type="button"
                        onClick={() => onViewAttachment(attachmentPath)}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                        View
                    </button>
                );
            },
        },
        {
            accessorKey: 'approval_status',
            header: 'Status',
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone(
                        row.original.approval_status,
                    )}`}
                >
                    {row.original.approval_status ?? 'draft'}
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
                    onCancel={onCancel}
                    onPrint={onPrint}
                />
            ),
        },
    ];
}
