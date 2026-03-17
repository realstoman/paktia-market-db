import { EmployeeAdvanceClient } from '@/components/tables/employee-advances/client';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Employee, EmployeeAdvance } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Employee Advances', href: '/finance/employee-advances' },
];

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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Advances" />
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
