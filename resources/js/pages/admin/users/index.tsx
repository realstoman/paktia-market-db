import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { columns } from './columns';

interface Role {
    name: string;
}

interface User {
    name: string;
    email: string;
    roles: Role[];
}

type UsersIndexProps = {
    users: User[];
    canCreate: boolean;
};

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

export default function index({ users, canCreate }: UsersIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 p-8">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">System Users</h1>

                    {canCreate && (
                        <Button onClick={() => router.visit('/users/create')}>
                            Create User
                        </Button>
                    )}
                </div>

                <DataTable columns={columns} data={users} />
            </div>
        </AppLayout>
    );
}
