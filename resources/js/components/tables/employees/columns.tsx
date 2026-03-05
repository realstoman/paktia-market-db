import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Branch, Country, Province, Role, User } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

export const buildColumns = (
    roles: Role[],
    countries: Country[],
    provinces: Province[],
    branches: Branch[],
): ColumnDef<User>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'roles',
        header: 'Role',
        cell: ({ row }) => {
            const roles = row.original.roles ?? [];
            if (roles.length === 0) {
                return (
                    <span className="text-xs text-muted-foreground">
                        No role
                    </span>
                );
            }
            return (
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
            );
        },
    },
    {
        accessorKey: 'branch',
        header: 'Branch',
    },
    {
        accessorKey: 'province',
        header: 'Province',
    },
    {
        accessorKey: 'country',
        header: 'Country',
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
            const active = row.getValue('is_active');
            return active ? (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                    Active
                </Badge>
            ) : (
                <Badge className="flex items-center gap-1 bg-red-100 text-neutral-800 dark:bg-red-200">
                    <Ban className="h-4 w-4 text-red-600" />
                    Blocked
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return date.toLocaleDateString();
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                roles={roles}
                countries={countries}
                provinces={provinces}
                branches={branches}
            />
        ),
    },
];
