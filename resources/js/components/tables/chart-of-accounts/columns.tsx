import { FinanceAccount } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function typeLabel(type: string) {
    if (type === 'cogs') {
        return 'COGS';
    }

    return type.charAt(0).toUpperCase() + type.slice(1);
}

function statusTone(status?: string) {
    return status === 'active'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    onEdit: (account: FinanceAccount) => void;
    onDelete: (account: FinanceAccount) => void;
    canDelete: boolean;
    t: (key: string, fallback?: string) => string;
}

export function buildColumns({
    onEdit,
    onDelete,
    canDelete,
    t,
}: BuildColumnsProps): ColumnDef<FinanceAccount>[] {
    return [
        {
            id: 'code',
            accessorKey: 'code',
            header: t('financeChartOfAccounts.table.code', 'Code'),
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.code}</p>
                    {row.original.description ? (
                        <p className="text-xs text-muted-foreground">
                            {row.original.description}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: t('financeChartOfAccounts.table.accountName', 'Account Name'),
        },
        {
            accessorKey: 'type',
            header: t('financeChartOfAccounts.table.type', 'Type'),
            cell: ({ row }) => typeLabel(row.original.type),
        },
        {
            id: 'parent.name',
            accessorFn: (row) =>
                row.parent ? `${row.parent.code} - ${row.parent.name}` : '-',
            header: t(
                'financeChartOfAccounts.table.parentAccount',
                'Parent Account',
            ),
        },
        {
            id: 'branch.name',
            accessorFn: (row) =>
                row.branch?.name ??
                t('financeChartOfAccounts.filters.allBranches', 'All Branches'),
            header: t('financeChartOfAccounts.table.branch', 'Branch'),
        },
        {
            accessorKey: 'currency_code',
            header: t('financeChartOfAccounts.table.currency', 'Currency'),
            cell: ({ row }) => row.original.currency_code ?? '-',
        },
        {
            accessorKey: 'is_postable',
            header: t('financeChartOfAccounts.table.postable', 'Postable'),
            cell: ({ row }) => (row.original.is_postable ? 'Yes' : 'No'),
        },
        {
            accessorKey: 'status',
            header: t('financeChartOfAccounts.table.status', 'Status'),
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                        row.original.status,
                    )}`}
                >
                    {row.original.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: t('financeChartOfAccounts.table.actions', 'Actions'),
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canDelete={canDelete && !row.original.is_system}
                />
            ),
        },
    ];
}
