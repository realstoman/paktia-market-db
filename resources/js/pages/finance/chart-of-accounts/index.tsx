import { ChartOfAccountsClient } from '@/components/tables/chart-of-accounts/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Branch, BreadcrumbItem, Currency, FinanceAccount } from '@/types';
import { Head } from '@inertiajs/react';

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
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t(
                'financeChartOfAccounts.pageTitle',
                'Chart of Accounts',
            ),
            href: '/finance/chart-of-accounts',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t(
                    'financeChartOfAccounts.pageTitle',
                    'Chart of Accounts',
                )}
            />
            <ChartOfAccountsClient
                accounts={accounts}
                parentAccounts={parentAccounts}
                branches={branches}
                currencies={currencies}
            />
        </AppLayout>
    );
}
