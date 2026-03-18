import { PayrollClient } from '@/components/tables/payroll/client';
import AppLayout from '@/layouts/app-layout';
import {
    Branch,
    BreadcrumbItem,
    Employee,
    EmployeeContract,
    PayrollRun,
} from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Payroll', href: '/finance/payroll' },
];

interface PayrollPageProps {
    runs: PayrollRun[];
    contracts: EmployeeContract[];
    branches: Branch[];
    employees: Employee[];
    canCreate: boolean;
    canApprove: boolean;
    canPay: boolean;
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
    contracts,
    branches,
    employees,
    canCreate,
    canApprove,
    canPay,
    summary,
}: PayrollPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <PayrollClient
                runs={runs}
                contracts={contracts}
                branches={branches}
                employees={employees}
                canCreate={canCreate}
                canApprove={canApprove}
                canPay={canPay}
                summary={summary}
            />
        </AppLayout>
    );
}
