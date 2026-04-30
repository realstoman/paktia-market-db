'use client';

import { BranchesClient } from '@/components/tables/branches/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import branches from '@/routes/branches';
import {
    Branch,
    BranchTable,
    BreadcrumbItem,
    Country,
    Kitchen,
    Province,
} from '@/types';
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
    branchTables: BranchTable[];
    countries: Country[];
    provinces: Province[];
    kitchens: Kitchen[];
}

export default function KitchensPage({
    branches,
    branchTables,
    countries,
    provinces,
    kitchens,
}: BranchesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branches" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <BranchesClient
                        data={branches}
                        branchTables={branchTables}
                        countries={countries}
                        provinces={provinces}
                        kitchens={kitchens}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
