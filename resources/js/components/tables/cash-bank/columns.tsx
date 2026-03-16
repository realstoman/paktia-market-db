import { CashMovement } from '@/types';
import { formatAfn } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function formatMovementDate(value?: string) {
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

function formatMovementTime(value?: string) {
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

function movementTypeLabel(value: string) {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function tone(status?: string) {
    if (status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    onEdit: (movement: CashMovement) => void;
    onApprove: (movement: CashMovement) => void;
    onViewAttachment: (path: string) => void;
}

export function buildColumns({
    onEdit,
    onApprove,
    onViewAttachment,
}: BuildColumnsProps): ColumnDef<CashMovement>[] {
    return [
        {
            accessorKey: 'movement_date',
            header: 'Date',
            cell: ({ row }) => {
                const dateText = formatMovementDate(row.original.movement_date);
                const timeText = formatMovementTime(row.original.created_at);

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
            accessorKey: 'movement_type',
            header: 'Movement',
            cell: ({ row }) => movementTypeLabel(row.original.movement_type),
        },
        {
            id: 'branch.name',
            accessorFn: (row) => row.branch?.name ?? 'All Branches',
            header: 'Branch',
        },
        {
            id: 'account.name',
            accessorFn: (row) =>
                row.account ? `${row.account.code} - ${row.account.name}` : '-',
            header: 'Account',
        },
        {
            id: 'counterparty_account.name',
            accessorFn: (row) =>
                row.counterparty_account
                    ? `${row.counterparty_account.code} - ${row.counterparty_account.name}`
                    : '-',
            header: 'Counterparty',
        },
        {
            accessorKey: 'direction',
            header: 'Direction',
            cell: ({ row }) =>
                row.original.direction === 'in' ? 'Inflow' : 'Outflow',
        },
        {
            accessorKey: 'payment_method',
            header: 'Payment Method',
            cell: ({ row }) =>
                row.original.payment_method
                    .replaceAll('_', ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase()),
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
                const attachmentPath = row.original.attachment_path;

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
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone(
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
                />
            ),
        },
    ];
}
