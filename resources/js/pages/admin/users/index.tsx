'use client';

import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { BreadcrumbItem, User } from '@/types';
import { Head } from '@inertiajs/react';

import { UsersClient } from '@/components/tables/users/users-client';

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
}

export default function UsersPage({ users }: UsersPageProps) {
    console.log('Users data is: ', users);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 p-8">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">System Users</h1>
                </div>

                <div className="p-6 text-gray-900">
                    <UsersClient data={users} />
                </div>
            </div>
        </AppLayout>
    );
}
