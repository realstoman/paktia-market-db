import { CashBankClient } from '@/components/tables/cash-bank/client';
import AppLayout from '@/layouts/app-layout';
import {
    Branch,
    BreadcrumbItem,
    CashMovement,
    CashMovementType,
    FinanceAccount,
} from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Cash & Bank', href: '/finance/cash-bank' },
];

interface CashBankPageProps {
    movements: CashMovement[];
    branches: Branch[];
    sourceAccounts: FinanceAccount[];
    targetAccounts: FinanceAccount[];
    movementTypes: CashMovementType[];
}

export default function CashBankPage({
    movements,
    branches,
    sourceAccounts,
    targetAccounts,
    movementTypes,
}: CashBankPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cash & Bank" />
            <CashBankClient
                movements={movements}
                branches={branches}
                sourceAccounts={sourceAccounts}
                targetAccounts={targetAccounts}
                movementTypes={movementTypes}
            />
        </AppLayout>
    );
}
