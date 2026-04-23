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
    afghanPayrollMonths: AfghanPayrollMonth[];
    currentAfghanPayrollMonth: AfghanPayrollMonth;
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

interface AfghanPayrollMonth {
    year: number;
    month: number;
    month_name: string;
    label: string;
    start: string;
    end: string;
}

export default function PayrollPage({
    runs,
    contracts,
    branches,
    employees,
    afghanPayrollMonths,
    currentAfghanPayrollMonth,
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
                afghanPayrollMonths={afghanPayrollMonths}
                currentAfghanPayrollMonth={currentAfghanPayrollMonth}
                canCreate={canCreate}
                canApprove={canApprove}
                canPay={canPay}
                summary={summary}
            />
        </AppLayout>
    );
}
