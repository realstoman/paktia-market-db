'use client';

import { BranchesClient } from '@/components/tables/branches/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import branches from '@/routes/branches';
import { Branch, BreadcrumbItem } from '@/types';
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
}

export default function BranchesPage({ branches }: BranchesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <BranchesClient data={branches} />
                </div>
            </div>
        </AppLayout>
    );
}
