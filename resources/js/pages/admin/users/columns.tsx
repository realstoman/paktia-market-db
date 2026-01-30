'use client';

import { ColumnDef } from '@tanstack/react-table';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
interface Role {
    name: string;
}

interface User {
    name: string;
    email: string;
    roles: Role[];
}

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        header: 'Roles',
        cell: ({ row }) => row.original.roles.map((r) => r.name).join(', '),
    },
];
