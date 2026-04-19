import { ExpenseCategory } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function statusTone(isActive?: boolean) {
    return isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    onEdit: (category: ExpenseCategory) => void;
    onDelete: (category: ExpenseCategory) => void;
    canDelete: boolean;
}

export function buildColumns({
    onEdit,
    onDelete,
    canDelete,
}: BuildColumnsProps): ColumnDef<ExpenseCategory>[] {
    return [
        {
            id: 'name',
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    {row.original.description ? (
                        <p className="text-xs text-muted-foreground">
                            {row.original.description}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            accessorKey: 'slug',
            header: 'Slug',
        },
        {
            id: 'expense_account.name',
            accessorFn: (row) =>
                row.expense_account
                    ? `${row.expense_account.code} - ${row.expense_account.name}`
                    : 'Not mapped',
            header: 'Ledger Account',
        },
        {
            accessorKey: 'sort_order',
            header: 'Sort',
            cell: ({ row }) => row.original.sort_order ?? 0,
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                        row.original.is_active,
                    )}`}
                >
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            accessorKey: 'expenses_count',
            header: 'Used In Expenses',
            cell: ({ row }) => row.original.expenses_count ?? 0,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canDelete={canDelete}
                />
            ),
        },
    ];
}
