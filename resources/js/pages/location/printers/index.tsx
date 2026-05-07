'use client';

import { PrintersClient } from '@/components/tables/printers/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Branch, BreadcrumbItem, Kitchen, Printer } from '@/types';
import { Head } from '@inertiajs/react';

interface PrintersPageProps {
    printers: Printer[];
    branches: Branch[];
    kitchens: Kitchen[];
}

export default function PrintersPage({
    printers,
    branches,
    kitchens,
}: PrintersPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.printers', 'Printers'), href: '/printers' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.printers', 'Printers')} />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <PrintersClient
                        data={printers}
                        branches={branches}
                        kitchens={kitchens}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
