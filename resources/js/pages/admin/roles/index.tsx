'use client';

import { RolesClient } from '@/components/tables/roles/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { BreadcrumbItem, Role } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Roles',
        href: users.index().url,
    },
];

interface RolesPageProps {
    roles: Role[];
}

export default function RolesPage({ roles }: RolesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <RolesClient data={roles} />
                </div>
            </div>
        </AppLayout>
    );
}
