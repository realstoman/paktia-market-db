import { ChartOfAccountsClient } from '@/components/tables/chart-of-accounts/client';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Currency, FinanceAccount } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Chart of Accounts', href: '/finance/chart-of-accounts' },
];

interface ChartOfAccountsPageProps {
    accounts: FinanceAccount[];
    parentAccounts: FinanceAccount[];
    branches: Branch[];
    currencies: Currency[];
}

export default function ChartOfAccountsPage({
    accounts,
    parentAccounts,
    branches,
    currencies,
}: ChartOfAccountsPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chart of Accounts" />
            <ChartOfAccountsClient
                accounts={accounts}
                parentAccounts={parentAccounts}
                branches={branches}
                currencies={currencies}
            />
        </AppLayout>
    );
}
