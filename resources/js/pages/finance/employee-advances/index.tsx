import { EmployeeAdvanceClient } from '@/components/tables/employee-advances/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Branch, BreadcrumbItem, Employee, EmployeeAdvance } from '@/types';
import { Head } from '@inertiajs/react';

interface EmployeeAdvancePageProps {
    printAdvanceId?: number | null;
    summary: {
        totalAmount: number;
        outstandingBalance: number;
        submittedCount: number;
        approvedCount: number;
    };
    advances: EmployeeAdvance[];
    branches: Branch[];
    employees: Employee[];
}

export default function EmployeeAdvancesPage({
    summary,
    advances,
    branches,
    employees,
    printAdvanceId,
}: EmployeeAdvancePageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t(
                'financeEmployeeAdvances.pageTitle',
                'Employee Advances',
            ),
            href: '/finance/employee-advances',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t(
                    'financeEmployeeAdvances.pageTitle',
                    'Employee Advances',
                )}
            />
            <EmployeeAdvanceClient
                advances={advances}
                branches={branches}
                employees={employees}
                printAdvanceId={printAdvanceId ?? null}
                summary={summary}
            />
        </AppLayout>
    );
}
