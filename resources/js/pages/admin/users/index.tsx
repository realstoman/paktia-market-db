'use client';

import { UsersClient } from '@/components/tables/users/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { BreadcrumbItem, Branch, Country, Province, Role, User } from '@/types';
import { Head } from '@inertiajs/react';

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
    roles: Role[];
    countries: Country[];
    provinces: Province[];
    branches: Branch[];
}

export default function UsersPage({
    users,
    roles,
    countries,
    provinces,
    branches,
}: UsersPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <UsersClient
                        data={users}
                        roles={roles}
                        countries={countries}
                        provinces={provinces}
                        branches={branches}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
