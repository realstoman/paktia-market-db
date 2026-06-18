'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { EmployeeClient } from '@/components/tables/employees/client';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { dashboard } from '@/routes';
import {
    Property,
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

interface EmployeesPageProps {
    employees: Employee[];
    properties: Property[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
    shifts: Shift[];
}

const BRANCH_FILTER_ALL = 'all';

export default function EmployeesPage({
    employees,
    properties,
    employmentTypes,
    employeePositions,
    shifts,
}: EmployeesPageProps) {
    const { t } = useLocalization();
    const [selectedPropertyId, setSelectedPropertyId] = useState(BRANCH_FILTER_ALL);
    const propertyOptions = useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );

    useAutoSelectSingleOption(
        propertyOptions,
        selectedPropertyId,
        setSelectedPropertyId,
        [BRANCH_FILTER_ALL],
    );
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard', 'Dashboard'),
            href: dashboard().url,
        },
        {
            title: t('navigation.employees', 'Employees'),
            href: '/employees',
        },
    ];

    const statsEmployees = useMemo(() => {
        if (selectedPropertyId === BRANCH_FILTER_ALL) {
            return employees;
        }

        return employees.filter(
            (employee) => String(employee.property_id ?? '') === selectedPropertyId,
        );
    }, [employees, selectedPropertyId]);

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
            <Head title={t('employees.page.title', 'Employees')} />
            <div className="space-y-4 pt-3 pb-4">
                <div className="flex justify-end">
                    <div className="w-full max-w-xs bg-white dark:bg-neutral-900">
                        <Select
                            value={selectedPropertyId}
                            onValueChange={setSelectedPropertyId}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue
                                    placeholder={t(
                                        'employees.page.selectPropertyForStats',
                                        'Select property for stats',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={BRANCH_FILTER_ALL}>
                                    {t(
                                        'employees.filters.allProperties',
                                        'All Properties',
                                    )}
                                </SelectItem>
                                {properties.map((property) => (
                                    <SelectItem
                                        key={property.id}
                                        value={String(property.id)}
                                    >
                                        {property.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <SummaryMetricCard
                        title={t('employees.page.totalEmployees', 'Total Employees')}
                        value={formatNumber(statsEmployees.length)}
                        description={t(
                            'employees.page.totalEmployeesDescription',
                            'Employees visible for the selected property scope.',
                        )}
                        icon={Users}
                        variant="blue"
                        className="md:col-span-6"
                    />

                    <SummaryMetricCard
                        title={t(
                            'employees.page.contractEmployees',
                            'Contract Employees',
                        )}
                        value={formatNumber(contractEmployeesCount)}
                        description={t(
                            'employees.page.contractEmployeesDescription',
                            'Employees with contract-based employment terms.',
                        )}
                        icon={BriefcaseBusiness}
                        variant="blue"
                        className="md:col-span-6"
                    />
                </div>

                <div className="rounded-lg bg-white p-6 text-gray-900 dark:bg-brand-bg-dark">
                    <EmployeeClient
                        data={employees}
                        properties={properties}
                        employmentTypes={employmentTypes}
                        employeePositions={employeePositions}
                        shifts={shifts}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
