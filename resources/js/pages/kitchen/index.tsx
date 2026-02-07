'use client';

import { BranchesClient } from '@/components/tables/branches/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import branches from '@/routes/branches';
import { Branch, BreadcrumbItem, Country, Province } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Branches',
        href: branches.index().url,
    },
];

interface BranchesPageProps {
    branches: Branch[];
    countries: Country[];
    provinces: Province[];
}

export default function KitchensPage({
    branches,
    countries,
    provinces,
}: BranchesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branches" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <BranchesClient
                        data={branches}
                        countries={countries}
                        provinces={provinces}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
