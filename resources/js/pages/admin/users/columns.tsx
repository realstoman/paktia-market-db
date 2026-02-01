'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';

interface Role {
    name: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    roles: Role[];
    blocked: boolean;
    created_at: string;
    country?: { name: string };
    province?: { name: string };
    branch?: { name: string };
}

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        meta: {
            label: 'Name',
            variant: 'text',
            placeholder: 'Filter by name...',
        },
        enableColumnFilter: true,
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        meta: {
            label: 'Email',
            variant: 'text',
            placeholder: 'Filter by email...',
        },
        enableColumnFilter: true,
    },
    {
        id: 'roles',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Roles" />
        ),
        accessorFn: (row) => row.roles.map((r) => r.name).join(', '),
        cell: ({ row }) => {
            const roles = row.original.roles;
            return roles.map((r) => r.name).join(', ') || '-';
        },
        meta: {
            label: 'Roles',
            variant: 'multiSelect',
            placeholder: 'Filter by roles...',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
                { label: 'Manager', value: 'manager' },
                // Add more roles as needed
            ],
        },
        enableColumnFilter: true,
    },
    {
        accessorKey: 'blocked',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const blocked = row.getValue('blocked');
            return blocked ? 'Blocked' : 'Active';
        },
        meta: {
            label: 'Status',
            variant: 'select',
            placeholder: 'Filter by status...',
            options: [
                { label: 'Active', value: 'false' },
                { label: 'Blocked', value: 'true' },
            ],
        },
        enableColumnFilter: true,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return date.toLocaleDateString();
        },
        meta: {
            label: 'Created At',
            variant: 'dateRange',
            placeholder: 'Filter by date...',
        },
        enableColumnFilter: true,
    },
];
