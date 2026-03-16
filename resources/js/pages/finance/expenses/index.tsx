import { ExpenseClient } from '@/components/tables/expenses/client';
import AppLayout from '@/layouts/app-layout';
import {
    Branch,
    BreadcrumbItem,
    Expense,
    ExpenseCategory,
    FinanceAccount,
    Vendor,
} from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Expenses', href: '/finance/expenses' },
];

interface ExpensesPageProps {
    expenses: Expense[];
    branches: Branch[];
    expenseCategories: ExpenseCategory[];
    vendors: Vendor[];
    ledgerAccounts: FinanceAccount[];
    paidFromAccounts: FinanceAccount[];
}

export default function ExpensesPage({
    expenses,
    branches,
    expenseCategories,
    vendors,
    ledgerAccounts,
    paidFromAccounts,
}: ExpensesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            <ExpenseClient
                expenses={expenses}
                branches={branches}
                expenseCategories={expenseCategories}
                vendors={vendors}
                ledgerAccounts={ledgerAccounts}
                paidFromAccounts={paidFromAccounts}
            />
        </AppLayout>
    );
}
