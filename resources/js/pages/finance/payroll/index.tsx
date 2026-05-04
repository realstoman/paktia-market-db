import { PayrollClient } from '@/components/tables/payroll/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    Branch,
    BreadcrumbItem,
    Employee,
    EmployeeContract,
    PayrollRun,
} from '@/types';
import { Head } from '@inertiajs/react';

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
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('common.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        {
            title: t('financePayroll.pageTitle', 'Payroll'),
            href: '/finance/payroll',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('financePayroll.pageTitle', 'Payroll')} />
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
