import { PayrollClient } from '@/components/tables/payroll/client';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Employee, PayrollRun } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Payroll', href: '/finance/payroll' },
];

interface PayrollPageProps {
    runs: PayrollRun[];
    branches: Branch[];
    employees: Employee[];
    summary: {
        activeEmployees: number;
        draftRuns: number;
        submittedRuns: number;
        unpaidPayroll: number;
        paidThisMonth: number;
        outstandingAdvances: number;
    };
}

export default function PayrollPage({
    runs,
    branches,
    employees,
    summary,
}: PayrollPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <PayrollClient
                runs={runs}
                branches={branches}
                employees={employees}
                summary={summary}
            />
        </AppLayout>
    );
}
