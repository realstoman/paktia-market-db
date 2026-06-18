import { CashBankClient } from '@/components/tables/cash-bank/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    Property,
    BreadcrumbItem,
    CashMovement,
    CashMovementType,
    FinanceAccount,
} from '@/types';
import { Head } from '@inertiajs/react';

interface CashBankPageProps {
    movements: CashMovement[];
    properties: Property[];
    sourceAccounts: FinanceAccount[];
    targetAccounts: FinanceAccount[];
    movementTypes: CashMovementType[];
    printMovementId?: number | null;
}

export default function CashBankPage({
    movements,
    properties,
    sourceAccounts,
    targetAccounts,
    movementTypes,
    printMovementId,
}: CashBankPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t('financeCashBank.pageTitle', 'Cash & Bank'),
            href: '/finance/cash-bank',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('financeCashBank.pageTitle', 'Cash & Bank')} />
            <CashBankClient
                movements={movements}
                properties={properties}
                sourceAccounts={sourceAccounts}
                targetAccounts={targetAccounts}
                movementTypes={movementTypes}
                printMovementId={printMovementId ?? null}
            />
        </AppLayout>
    );
}
