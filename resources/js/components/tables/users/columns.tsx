import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Branch, Country, Kitchen, Province, Role, User } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';
type TranslateFn = (key: string, fallback?: string) => string;

export const buildColumns = (
    roles: Role[],
    countries: Country[],
    provinces: Province[],
    branches: Branch[],
    kitchens: Kitchen[],
    t: TranslateFn,
    locale: string,
): ColumnDef<User>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label={t('users.table.selectAll', 'Select all')}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t('users.table.selectRow', 'Select row')}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: t('users.table.id', 'ID'),
    },
    {
        accessorKey: 'name',
        header: t('users.table.name', 'Name'),
    },
    {
        accessorKey: 'email',
        header: t('users.table.email', 'Email'),
    },
    {
        accessorKey: 'roles',
        header: t('users.table.role', 'Role'),
        cell: ({ row }) => {
            const roles = row.original.roles ?? [];
            const userKitchen =
                typeof row.original.kitchen === 'string'
                    ? row.original.kitchen
                    : row.original.kitchen?.name ?? null;
            const hasKitchenRole = roles.some((role) =>
                typeof role === 'string'
                    ? role === 'kitchen'
                    : role.name === 'kitchen',
            );

            if (roles.length === 0) {
                return (
                    <span className="text-xs text-muted-foreground">
                        {t('users.common.noRole', 'No role')}
                    </span>
                );
            }
            return (
                <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                        {roles.map((role, index) =>
                            typeof role === 'string' ? (
                                <Badge key={`${role}-${index}`} variant="secondary">
                                    {role}
                                </Badge>
                            ) : (
                                <Badge key={role.id} variant="secondary">
                                    {role.name}
                                </Badge>
                            ),
                        )}
                    </div>
                    {hasKitchenRole && userKitchen ? (
                        <p className="text-xs text-muted-foreground">
                            {userKitchen}
                        </p>
                    ) : null}
                </div>
            );
        },
    },
    {
        accessorKey: 'branch',
        header: t('users.table.branch', 'Branch'),
    },
    {
        accessorKey: 'province',
        header: t('users.table.province', 'Province'),
    },
    {
        accessorKey: 'country',
        header: t('users.table.country', 'Country'),
    },
    {
        accessorKey: 'is_active',
        header: t('users.table.status', 'Status'),
        cell: ({ row }) => {
            const active = row.getValue('is_active');
            return active ? (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                    {t('users.statuses.active', 'Active')}
                </Badge>
            ) : (
                <Badge className="flex items-center gap-1 bg-red-100 text-neutral-800 dark:bg-red-200">
                    <Ban className="h-4 w-4 text-red-600" />
                    {t('users.statuses.blocked', 'Blocked')}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: t('users.table.createdAt', 'Created At'),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return new Intl.DateTimeFormat(
                locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US',
            ).format(date);
        },
    },
    {
        id: 'actions',
        header: t('users.table.actions', 'Actions'),
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                roles={roles}
                countries={countries}
                provinces={provinces}
                branches={branches}
                kitchens={kitchens}
            />
        ),
    },
];
