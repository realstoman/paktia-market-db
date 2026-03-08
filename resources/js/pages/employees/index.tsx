'use client';

import { EmployeeClient } from '@/components/tables/employees/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import {
    Branch,
    BreadcrumbItem,
    Employee,
    EmployeePosition,
    EmploymentType,
    Shift,
} from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Employees',
        href: '/employees',
    },
];

interface EmployeesPageProps {
    employees: Employee[];
    branches: Branch[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
    shifts: Shift[];
}

export default function EmployeesPage({
    employees,
    branches,
    employmentTypes,
    employeePositions,
    shifts,
}: EmployeesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <EmployeeClient
                        data={employees}
                        branches={branches}
                        employmentTypes={employmentTypes}
                        employeePositions={employeePositions}
                        shifts={shifts}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
