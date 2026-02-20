'use client';

import { InventoryClient } from '@/components/tables/inventory/client';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, InventoryItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventory',
        href: '/inventory',
    },
];

interface InventoryPageProps {
    inventoryItems: InventoryItem[];
    branches: Branch[];
}

export default function InventoryPage({
    inventoryItems,
    branches,
}: InventoryPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <InventoryClient data={inventoryItems} branches={branches} />
                </div>
            </div>
        </AppLayout>
    );
}
