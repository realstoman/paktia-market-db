import { ExpenseCategoryClient } from '@/components/tables/expense-categories/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { BreadcrumbItem, ExpenseCategory, FinanceAccount } from '@/types';
import { Head } from '@inertiajs/react';

interface ExpenseCategoriesPageProps {
    expenseCategories: ExpenseCategory[];
    financeAccounts: FinanceAccount[];
}

export default function ExpenseCategoriesPage({
    expenseCategories,
    financeAccounts,
}: ExpenseCategoriesPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('common.dashboard', 'Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('navigation.finance', 'Finance'),
            href: '/finance',
        },
        {
            title: t(
                'financeExpenseCategories.pageTitle',
                'Expense Categories',
            ),
            href: '/finance/expense-categories',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t(
                    'financeExpenseCategories.pageTitle',
                    'Expense Categories',
                )}
            />
            <ExpenseCategoryClient
                expenseCategories={expenseCategories}
                financeAccounts={financeAccounts}
            />
        </AppLayout>
    );
}
