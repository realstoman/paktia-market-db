import { ExpenseClient } from '@/components/tables/expenses/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    Branch,
    BreadcrumbItem,
    Expense,
    ExpenseCategory,
    FinanceAccount,
    Vendor,
} from '@/types';
import { Head } from '@inertiajs/react';

interface ExpensesPageProps {
    expenses: Expense[];
    branches: Branch[];
    expenseCategories: ExpenseCategory[];
    vendors: Vendor[];
    ledgerAccounts: FinanceAccount[];
    paidFromAccounts: FinanceAccount[];
    printExpenseId?: number | null;
}

export default function ExpensesPage({
    expenses,
    branches,
    expenseCategories,
    vendors,
    ledgerAccounts,
    paidFromAccounts,
    printExpenseId,
}: ExpensesPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t('financeExpenses.pageTitle', 'Expenses'),
            href: '/finance/expenses',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('financeExpenses.pageTitle', 'Expenses')} />
            <ExpenseClient
                expenses={expenses}
                branches={branches}
                expenseCategories={expenseCategories}
                vendors={vendors}
                ledgerAccounts={ledgerAccounts}
                paidFromAccounts={paidFromAccounts}
                printExpenseId={printExpenseId ?? null}
            />
        </AppLayout>
    );
}
