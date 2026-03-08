'use client';

import { EmployeeClient } from '@/components/tables/employees/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { BriefcaseBusiness, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

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

const BRANCH_FILTER_ALL = 'all';

export default function EmployeesPage({
    employees,
    branches,
    employmentTypes,
    employeePositions,
    shifts,
}: EmployeesPageProps) {
    const [selectedBranchId, setSelectedBranchId] =
        useState(BRANCH_FILTER_ALL);
    const statsEmployees = useMemo(() => {
        if (selectedBranchId === BRANCH_FILTER_ALL) {
            return employees;
        }

        return employees.filter(
            (employee) => String(employee.branch_id ?? '') === selectedBranchId,
        );
    }, [employees, selectedBranchId]);

    const contractEmployeesCount = useMemo(
        () =>
            statsEmployees.filter((employee) => {
                const employmentType = String(
                    employee.employment_type ?? '',
                ).toLowerCase();
                const contractAmount = employee.contract_amount;
                const hasContractAmount =
                    contractAmount !== null &&
                    contractAmount !== undefined &&
                    String(contractAmount).trim() !== '';

                return hasContractAmount || employmentType.includes('contract');
            }).length,
        [statsEmployees],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="space-y-4 pt-3 pb-4">
                <div className="flex justify-end">
                    <div className="w-full max-w-xs bg-white dark:bg-neutral-900">
                        <Select
                            value={selectedBranchId}
                            onValueChange={setSelectedBranchId}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select branch for stats" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={BRANCH_FILTER_ALL}>
                                    All Branches
                                </SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem
                                        key={branch.id}
                                        value={String(branch.id)}
                                    >
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-6 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                            <CardTitle className="text-sm">
                                Total Employees
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight">
                                {formatNumber(statsEmployees.length)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-6 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                            <CardTitle className="text-sm">
                                Contract Employees
                            </CardTitle>
                            <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight">
                                {formatNumber(contractEmployeesCount)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="rounded-lg bg-white p-6 text-gray-900 dark:bg-brand-bg-dark">
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
