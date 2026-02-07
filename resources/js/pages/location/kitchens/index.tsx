'use client';

import { KitchensClient } from '@/components/tables/kitchens/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import kitchens from '@/routes/kitchens';
import { Branch, BreadcrumbItem, Kitchen } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Kitchens',
        href: kitchens.index().url,
    },
];

interface KitchensPageProps {
    kitchens: Kitchen[];
    branches: Branch[];
}

export default function KitchensPage({
    kitchens,
    branches,
}: KitchensPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kitchens" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <KitchensClient data={kitchens} branches={branches} />
                </div>
            </div>
        </AppLayout>
    );
}
