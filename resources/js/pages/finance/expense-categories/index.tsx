import { ExpenseCategoryClient } from '@/components/tables/expense-categories/client';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ExpenseCategory, FinanceAccount } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Finance',
        href: '/finance',
    },
    {
        title: 'Expense Categories',
        href: '/finance/expense-categories',
    },
];

interface ExpenseCategoriesPageProps {
    expenseCategories: ExpenseCategory[];
    financeAccounts: FinanceAccount[];
}

export default function ExpenseCategoriesPage({
    expenseCategories,
    financeAccounts,
}: ExpenseCategoriesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expense Categories" />
            <ExpenseCategoryClient
                expenseCategories={expenseCategories}
                financeAccounts={financeAccounts}
            />
        </AppLayout>
    );
}
