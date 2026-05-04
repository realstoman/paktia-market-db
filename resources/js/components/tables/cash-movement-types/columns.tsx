import { CashMovementType } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function directionLabel(direction?: string | null) {
    if (!direction) return 'Flexible';
    return direction === 'in' ? 'Inflow' : 'Outflow';
}

function statusTone(isActive?: boolean) {
    return isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

interface BuildColumnsProps {
    t: (key: string, fallback?: string) => string;
    onEdit: (movementType: CashMovementType) => void;
    onDelete: (movementType: CashMovementType) => void;
    canDelete: boolean;
}

export function buildColumns({
    t,
    onEdit,
    onDelete,
    canDelete,
}: BuildColumnsProps): ColumnDef<CashMovementType>[] {
    return [
        {
            id: 'name',
            accessorKey: 'name',
            header: t('financeCashMovementTypes.table.name', 'Name'),
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
            header: t('financeCashMovementTypes.table.slug', 'Slug'),
        },
        {
            accessorKey: 'default_direction',
            header: t(
                'financeCashMovementTypes.table.defaultDirection',
                'Default Direction',
            ),
            cell: ({ row }) => directionLabel(row.original.default_direction),
        },
        {
            accessorKey: 'requires_counterparty',
            header: t(
                'financeCashMovementTypes.table.needsTarget',
                'Needs Target',
            ),
            cell: ({ row }) =>
                row.original.requires_counterparty
                    ? t('financeCashMovementTypes.common.yes', 'Yes')
                    : t('financeCashMovementTypes.common.no', 'No'),
        },
        {
            accessorKey: 'sort_order',
            header: t('financeCashMovementTypes.table.sort', 'Sort'),
            cell: ({ row }) => row.original.sort_order ?? 0,
        },
        {
            accessorKey: 'is_active',
            header: t('financeCashMovementTypes.table.status', 'Status'),
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                        row.original.is_active,
                    )}`}
                >
                    {row.original.is_active
                        ? t(
                              'financeCashMovementTypes.statuses.active',
                              'Active',
                          )
                        : t(
                              'financeCashMovementTypes.statuses.inactive',
                              'Inactive',
                          )}
                </span>
            ),
        },
        {
            id: 'actions',
            header: t('financeCashMovementTypes.table.actions', 'Actions'),
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
