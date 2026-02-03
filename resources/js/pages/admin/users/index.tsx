'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { BreadcrumbItem, User } from '@/types';
import { Head } from '@inertiajs/react';
import { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { useState } from 'react';
import { columns } from './columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Users',
        href: users.index().url,
    },
];

interface UsersPageProps {
    users: User[];
    totalItems: number;
    perPage?: number;
    page?: number;
    sort?: any;
    search?: string;
}

export default function UsersPage({
    users,
    totalItems,
    perPage = 10,
    page = 1,
    sort = [],
    search = '',
}: UsersPageProps) {
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: perPage,
    });
    console.log('UsersPage props:', {
        users,
        totalItems,
        perPage,
        page,
        sort,
        search,
    });

    const pageCount = Math.ceil(totalItems / perPage);

    const { table } = useDataTable({
        data: users,
        columns,
        pageCount,
        initialState: {
            pagination: {
                pageIndex: page - 1,
                pageSize: perPage,
            },
            sorting: sort,
            columnFilters: [],
        },
        shallow: false,
        debounceMs: 500,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 p-8">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">System Users</h1>
                </div>

                <DataTable
                    data={users}
                    search={search}
                    setSearch={setSearch}
                    sorting={sorting}
                    setSorting={setSorting}
                    columnFilters={columnFilters}
                    setColumnFilters={setColumnFilters}
                    pagination={pagination}
                    setPagination={setPagination}
                >
                    <DataTableToolbar
                        data={users}
                        search={search}
                        setSearch={setSearch}
                        sorting={sorting}
                        setSorting={setSorting}
                        columnFilters={columnFilters}
                        setColumnFilters={setColumnFilters}
                        pagination={pagination}
                        setPagination={setPagination}
                    />
                </DataTable>
            </div>
        </AppLayout>
    );
}
