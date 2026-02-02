'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';

interface Role {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    blocked_at?: string;
    country_id?: number;
    province_id?: number;
    branch_id?: number;
    roles: Role[];
    country?: { id: number; name: string; code: string };
    province?: { id: number; name: string };
    branch?: { id: number; name: string };
}

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'id',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue('id')}</div>
        ),
        enableColumnFilter: true,
        meta: {
            label: 'ID',
            variant: 'text',
            placeholder: 'Filter by ID...',
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
        enableColumnFilter: true,
        meta: {
            label: 'Name',
            variant: 'text',
            placeholder: 'Filter by name...',
        },
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => <div>{row.getValue('email')}</div>,
        enableColumnFilter: true,
        meta: {
            label: 'Email',
            variant: 'text',
            placeholder: 'Filter by email...',
        },
    },
    {
        id: 'roles',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Roles" />
        ),
        accessorFn: (row) => row.roles?.map((r) => r.name).join(', ') || '',
        cell: ({ row }) => {
            const roles = row.original.roles;
            return <div>{roles?.map((r) => r.name).join(', ') || '-'}</div>;
        },
        enableColumnFilter: true,
        meta: {
            label: 'Roles',
            variant: 'multiSelect',
            placeholder: 'Filter by roles...',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
                // Add more roles based on your actual data
            ],
        },
    },
    {
        accessorKey: 'is_active',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const isActive = row.getValue('is_active');
            return (
                <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {isActive ? 'Active' : 'Blocked'}
                </div>
            );
        },
        enableColumnFilter: true,
        meta: {
            label: 'Status',
            variant: 'select',
            placeholder: 'Filter by status...',
            options: [
                { label: 'Active', value: 'true' },
                { label: 'Blocked', value: 'false' },
            ],
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return (
                <div>
                    {date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </div>
            );
        },
        enableColumnFilter: true,
        meta: {
            label: 'Created At',
            variant: 'dateRange',
            placeholder: 'Filter by date...',
        },
    },
];
