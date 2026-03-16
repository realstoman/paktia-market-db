import { CashMovementTypeClient } from '@/components/tables/cash-movement-types/client';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, CashMovementType } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Cash & Bank', href: '/finance/cash-bank' },
    { title: 'Movement Types', href: '/finance/cash-movement-types' },
];

interface CashMovementTypesPageProps {
    movementTypes: CashMovementType[];
}

export default function CashMovementTypesPage({
    movementTypes,
}: CashMovementTypesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cash Movement Types" />
            <CashMovementTypeClient movementTypes={movementTypes} />
        </AppLayout>
    );
}
