import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { dateFilter, selectFilter, textFilter } from '@/lib/data-table-filters';
import { User } from '@/types';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        enableColumnFilter: true,
        filterFn: textFilter,
        meta: {
            label: 'Name',
            variant: 'text',
            placeholder: 'Search name...',
        },
    },

    {
        accessorKey: 'email',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        enableColumnFilter: true,
        filterFn: textFilter,
        meta: {
            label: 'Email',
            variant: 'text',
        },
    },

    {
        accessorKey: 'role',
        enableColumnFilter: true,
        filterFn: selectFilter,
        meta: {
            label: 'Role',
            variant: 'select',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
            ],
        },
    },

    {
        accessorKey: 'created_at',
        enableColumnFilter: true,
        filterFn: dateFilter,
        meta: {
            label: 'Created',
            variant: 'dateRange',
        },
    },
];
