'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { RolesClient } from '@/components/tables/roles/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { BreadcrumbItem, Permission, Role } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { KeyRound, LockKeyhole, ShieldCheck, UserRoundCog } from 'lucide-react';

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
    permissions: Permission[];
}

export default function RolesPage({ roles, permissions }: RolesPageProps) {
    const rolesWithPermissions = roles.filter(
        (role) => (role.permissions?.length ?? 0) > 0,
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryMetricCard
                        title="Total Roles"
                        value={formatNumber(roles.length)}
                        description="Role definitions available in the system."
                        icon={ShieldCheck}
                        variant="rose"
                    />
                    <SummaryMetricCard
                        title="Permissions"
                        value={formatNumber(permissions.length)}
                        description="Permission entries available for assignment."
                        icon={LockKeyhole}
                        variant="rose"
                    />
                    <SummaryMetricCard
                        title="Configured Roles"
                        value={formatNumber(rolesWithPermissions)}
                        description="Roles that already have permission mappings."
                        icon={UserRoundCog}
                        variant="rose"
                    />
                    <SummaryMetricCard
                        title="Average Permissions"
                        value={
                            roles.length > 0
                                ? formatNumber(
                                      Math.round(
                                          roles.reduce(
                                              (count, role) =>
                                                  count +
                                                  (role.permissions?.length ??
                                                      0),
                                              0,
                                          ) / roles.length,
                                      ),
                                  )
                                : 0
                        }
                        description="Average permission count assigned per role."
                        icon={KeyRound}
                        variant="rose"
                    />
                </div>
                <div className="rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                    <div className="p-6 text-gray-900">
                        <RolesClient data={roles} permissions={permissions} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
