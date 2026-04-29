import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Permission, Role } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

const MAX_VISIBLE_PERMISSIONS = 3;
type TranslateFn = (key: string, fallback?: string) => string;

export const buildColumns = (
    permissions: Permission[],
    onDuplicate: (role: Role) => void,
    t: TranslateFn,
): ColumnDef<Role>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label={t('roles.table.selectAll', 'Select all')}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t('roles.table.selectRow', 'Select row')}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: t('roles.table.id', 'ID'),
    },
    {
        accessorKey: 'name',
        header: t('roles.table.name', 'Name'),
    },
    {
        id: 'permissions',
        header: t('roles.table.permissions', 'Permissions'),
        cell: ({ row }) => {
            const permissions = row.original.permissions ?? [];
            const visible = permissions.slice(0, MAX_VISIBLE_PERMISSIONS);
            const hidden = permissions.slice(MAX_VISIBLE_PERMISSIONS);

            if (permissions.length === 0) {
                return (
                    <span className="text-xs text-muted-foreground">
                        {t('roles.common.noPermissions', 'No permissions')}
                    </span>
                );
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {visible.map((permission) => (
                        <Badge
                            key={`${permission.id}-${permission.name}`}
                            variant="secondary"
                        >
                            {permission.name}
                        </Badge>
                    ))}
                    {hidden.length > 0 && (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        className="cursor-help"
                                    >
                                        {t(
                                            'roles.table.morePermissions',
                                            '+:count more',
                                        ).replace(':count', String(hidden.length))}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="border bg-white">
                                    <div className="flex flex-wrap gap-1">
                                        {hidden.map((permission) => (
                                            <Badge
                                                key={`${permission.id}-${permission.name}`}
                                                variant="secondary"
                                            >
                                                {permission.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: t('roles.table.createdAt', 'Created At'),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return date.toLocaleDateString();
        },
    },
    {
        id: 'actions',
        header: t('roles.table.actions', 'Actions'),
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                permissions={permissions}
                onDuplicate={onDuplicate}
            />
        ),
    },
];
