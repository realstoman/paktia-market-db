import { CashMovementTypeClient } from '@/components/tables/cash-movement-types/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { BreadcrumbItem, CashMovementType } from '@/types';
import { Head } from '@inertiajs/react';

interface CashMovementTypesPageProps {
    movementTypes: CashMovementType[];
}

export default function CashMovementTypesPage({
    movementTypes,
}: CashMovementTypesPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t('financeCashBank.pageTitle', 'Cash & Bank'),
            href: '/finance/cash-bank',
        },
        {
            title: t(
                'financeCashMovementTypes.pageTitle',
                'Movement Types',
            ),
            href: '/finance/cash-movement-types',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t(
                    'financeCashMovementTypes.metaTitle',
                    'Cash Movement Types',
                )}
            />
            <CashMovementTypeClient movementTypes={movementTypes} />
        </AppLayout>
    );
}
