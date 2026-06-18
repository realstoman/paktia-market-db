'use client';

import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { EmployeeClient } from '@/components/tables/employees/client';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';
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
import {
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    ScanFace,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface EmployeesPageProps {
    employees: Employee[];
    properties: Property[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
    shifts: Shift[];
}

const PROPERTY_FILTER_ALL = 'all';

export default function EmployeesPage({
    employees,
    properties,
    employmentTypes,
    employeePositions,
    shifts,
}: EmployeesPageProps) {
    const { t, isRtl } = useLocalization();
    const [selectedPropertyId, setSelectedPropertyId] = useState(PROPERTY_FILTER_ALL);
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
        [PROPERTY_FILTER_ALL],
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
        if (selectedPropertyId === PROPERTY_FILTER_ALL) {
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
    const activeEmployeesCount = useMemo(
        () =>
            statsEmployees.filter(
                (employee) =>
                    employee.is_active !== false &&
                    String(employee.status ?? 'active').toLowerCase() ===
                        'active',
            ).length,
        [statsEmployees],
    );
    const representedProperties = useMemo(
        () =>
            new Set(
                statsEmployees
                    .map((employee) => employee.property_id)
                    .filter((propertyId) => propertyId !== null && propertyId !== undefined),
            ).size,
        [statsEmployees],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('employees.page.title', 'Employees')} />
            <div
                dir={isRtl ? 'rtl' : 'ltr'}
                className="mx-auto w-full max-w-[1680px] space-y-6 pb-6"
            >
                <section className="relative overflow-hidden rounded-[2rem] bg-[#18233f] p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.38),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.18),transparent_34%)]" />
                    <div className="pointer-events-none absolute -top-24 -end-20 h-72 w-72 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -top-12 -end-8 h-48 w-48 rounded-full border border-white/10" />
                    <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                        <div className="max-w-3xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-indigo-100 uppercase backdrop-blur">
                                <ScanFace className="h-4 w-4" />
                                {t(
                                    'employees.page.peopleOperations',
                                    'People operations',
                                )}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                {t(
                                    'employees.page.heroTitle',
                                    'A clearer view of every team',
                                )}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                                {t(
                                    'employees.page.heroDescription',
                                    'Manage employee records, contracts, roles, shifts, and property assignments from one organized workspace.',
                                )}
                            </p>
                        </div>
                        <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur lg:max-w-sm">
                            <p className="mb-2 px-1 text-xs font-medium text-white/60">
                                {t(
                                    'employees.page.workforceScope',
                                    'Workforce scope',
                                )}
                            </p>
                            <SearchableDropdown
                                value={selectedPropertyId}
                                onValueChange={setSelectedPropertyId}
                                placeholder={t(
                                    'employees.page.selectPropertyForStats',
                                    'Select property for stats',
                                )}
                                searchPlaceholder={t(
                                    'employees.filters.searchProperties',
                                    'Search properties...',
                                )}
                                emptyText={t(
                                    'employees.filters.noProperties',
                                    'No properties found.',
                                )}
                                className="h-11 border-white/20 bg-white text-slate-900 hover:bg-white"
                                options={[
                                    {
                                        value: PROPERTY_FILTER_ALL,
                                        label: t(
                                            'employees.filters.allProperties',
                                            'All Properties',
                                        ),
                                    },
                                    ...propertyOptions,
                                ]}
                            />
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <WorkforceMetric
                        title={t(
                            'employees.page.totalEmployees',
                            'Total Employees',
                        )}
                        value={formatNumber(statsEmployees.length)}
                        description={t(
                            'employees.page.totalEmployeesDescription',
                            'Employees visible for the selected property scope.',
                        )}
                        icon={Users}
                        tone="indigo"
                    />
                    <WorkforceMetric
                        title={t(
                            'employees.page.activeEmployees',
                            'Active Employees',
                        )}
                        value={formatNumber(activeEmployeesCount)}
                        description={t(
                            'employees.page.activeEmployeesDescription',
                            'Employees currently active in operations.',
                        )}
                        icon={BadgeCheck}
                        tone="emerald"
                    />
                    <WorkforceMetric
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
                        tone="amber"
                    />
                    <WorkforceMetric
                        title={t(
                            'employees.page.propertiesRepresented',
                            'Properties Represented',
                        )}
                        value={formatNumber(representedProperties)}
                        description={t(
                            'employees.page.propertiesRepresentedDescription',
                            'Properties with assigned employees in this scope.',
                        )}
                        icon={Building2}
                        tone="sky"
                    />
                </section>

                <section className="rounded-[2rem] border border-white/80 bg-white p-4 text-slate-900 shadow-sm sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
                    <EmployeeClient
                        data={employees}
                        properties={properties}
                        employmentTypes={employmentTypes}
                        employeePositions={employeePositions}
                        shifts={shifts}
                    />
                </section>
            </div>
        </AppLayout>
    );
}

type WorkforceMetricTone = 'indigo' | 'emerald' | 'amber' | 'sky';

const workforceToneStyles: Record<
    WorkforceMetricTone,
    { icon: string; glow: string }
> = {
    indigo: {
        icon: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
        glow: 'bg-indigo-400/15',
    },
    emerald: {
        icon: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        glow: 'bg-emerald-400/15',
    },
    amber: {
        icon: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        glow: 'bg-amber-400/15',
    },
    sky: {
        icon: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
        glow: 'bg-sky-400/15',
    },
};

function WorkforceMetric({
    title,
    value,
    description,
    icon: Icon,
    tone,
}: {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    tone: WorkforceMetricTone;
}) {
    const styles = workforceToneStyles[tone];

    return (
        <div className="group relative min-h-36 overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-neutral-800 dark:bg-neutral-900">
            <div
                className={cn(
                    'pointer-events-none absolute -end-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125',
                    styles.glow,
                )}
            />
            <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase dark:text-neutral-400">
                        {title}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        {value}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-neutral-400">
                        {description}
                    </p>
                </div>
                <span className={cn('rounded-2xl p-3', styles.icon)}>
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </div>
    );
}
