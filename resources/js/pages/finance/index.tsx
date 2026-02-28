'use client';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
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
];

const financeModules = [
    'Assets',
    'Employees',
    'Expenses',
    'Revenue',
    'Payroll',
    'Reports',
];

export default function FinancePage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance" />

            <div className="space-y-6 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Finance
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Manage restaurant financial operations from one place.
                        This section is ready for assets, employees, expenses,
                        and more.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {financeModules.map((module) => (
                        <div
                            key={module}
                            className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40"
                        >
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {module}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Coming soon
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
