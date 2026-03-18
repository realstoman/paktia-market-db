'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { UsersClient } from '@/components/tables/users/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { BreadcrumbItem, Branch, Country, Province, Role, User } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { Building2, Globe2, ShieldCheck, Users } from 'lucide-react';

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
    const activeUsers = users.filter((user) => user.is_active !== false).length;
    const blockedUsers = users.length - activeUsers;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryMetricCard
                        title="Total Users"
                        value={formatNumber(users.length)}
                        description="All user accounts currently available."
                        icon={Users}
                        variant="indigo"
                    />
                    <SummaryMetricCard
                        title="Active Users"
                        value={formatNumber(activeUsers)}
                        description="Users with active account access."
                        icon={ShieldCheck}
                        variant="indigo"
                    />
                    <SummaryMetricCard
                        title="Blocked Users"
                        value={formatNumber(blockedUsers)}
                        description="Users currently blocked from access."
                        icon={Building2}
                        variant="indigo"
                    />
                    <SummaryMetricCard
                        title="Countries"
                        value={formatNumber(countries.length)}
                        description="Countries available for user assignment."
                        icon={Globe2}
                        variant="indigo"
                    />
                </div>
                <div className="rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
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
            </div>
        </AppLayout>
    );
}
