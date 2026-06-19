import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { formatNumber, formatPrice } from '@/utils/format';
import { Head } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    CircleDollarSign,
    DoorOpen,
    Layers3,
    ReceiptText,
    Store,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface ExpenseRow {
    id: number;
    title: string;
    amount: number;
    date: string;
    status: string;
}

interface PortfolioProject {
    id: number;
    name: string;
    type: 'market' | 'mall' | 'block' | 'house';
    address?: string | null;
    isActive: boolean;
    floors: number;
    shops: number;
    occupiedShops: number;
    availableShops: number;
    registeredTenants: number;
    inventoryItems: number;
    employees: number;
    rent: {
        collectedAfn: number;
        remainingAfn: number;
        collectedUsd: number;
        remainingUsd: number;
    };
    expensesAfn: number;
    cashPositionAfn: number;
    recentExpenses: ExpenseRow[];
}

interface DashboardData {
    portfolio: {
        totalProjects: number;
        activeProjects: number;
        totalFloors: number;
        totalShops: number;
        registeredTenants: number;
        projects: PortfolioProject[];
    };
    inventory: null | {
        totalItems: number;
        inventoryValue: number;
    };
    finance: null | {
        expenses: number;
        cashPosition: number;
        pendingExpenses: number;
        recentExpenses: Array<ExpenseRow & { property: string }>;
    };
}

const COLORS = {
    teal: '#002452',
    green: '#d3a450',
    coral: '#ef786f',
    blue: '#5d91c9',
    mist: '#eef2f7',
};

function StatCard({
    label,
    value,
    icon: Icon,
    accent = 'teal',
}: {
    label: string;
    value: string;
    icon: typeof Building2;
    accent?: 'teal' | 'green' | 'coral' | 'blue';
}) {
    const tones = {
        teal: 'bg-[#eef2f7] text-[#002452]',
        green: 'bg-[#f8f1e5] text-[#a4772d]',
        coral: 'bg-rose-50 text-[#ef786f]',
        blue: 'bg-blue-50 text-[#5d91c9]',
    };

    return (
        <div className="flex items-center gap-4 rounded-2xl border border-[#dfe7e9] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[accent]}`}
            >
                <Icon className="size-5" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {value}
                </p>
            </div>
        </div>
    );
}

function MoneyCard({
    title,
    collected,
    remaining,
    currency,
    t,
}: {
    title: string;
    collected: number;
    remaining: number;
    currency: string;
    t: (key: string, fallback?: string) => string;
}) {
    return (
        <div className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500">{title}</p>
                    <p className="mt-1 text-2xl font-bold text-[#002452] dark:text-white">
                        {formatPrice(collected)} {currency}
                    </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#eef2f7] text-[#002452]">
                    <Banknote className="size-5" />
                </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[#edf1f2] pt-4 text-sm dark:border-neutral-800">
                <span className="text-slate-500">
                    {t('propertyDashboard.remaining', 'Remaining')}
                </span>
                <strong className="text-[#ef786f]">
                    {formatPrice(remaining)} {currency}
                </strong>
            </div>
        </div>
    );
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center rounded-xl bg-[#f8fbfb] text-sm text-slate-400 dark:bg-neutral-950">
            {label}
        </div>
    );
}

export default function Dashboard({ data }: { data: DashboardData }) {
    const { locale, t } = useLocalization();
    const [activeTab, setActiveTab] = useState<string>('overall');
    const projects = useMemo(
        () =>
            [...data.portfolio.projects].sort((first, second) =>
                first.name.localeCompare(second.name, locale, {
                    sensitivity: 'base',
                }),
            ),
        [data.portfolio.projects, locale],
    );
    const selectedProject = projects.find(
        (project) => String(project.id) === activeTab,
    );

    const overallProjectChart = useMemo(
        () =>
            projects.map((project) => ({
                name: project.name,
                expenses: project.expensesAfn,
                cash: project.cashPositionAfn,
            })),
        [projects],
    );
    const overallPie = [
        {
            name: t('propertyDashboard.activeProjects', 'Active properties'),
            value: data.portfolio.activeProjects,
            color: COLORS.green,
        },
        {
            name: t(
                'propertyDashboard.inactiveProjects',
                'Inactive properties',
            ),
            value: Math.max(
                0,
                data.portfolio.totalProjects - data.portfolio.activeProjects,
            ),
            color: COLORS.coral,
        },
    ];
    const projectRentChart = selectedProject
        ? [
              {
                  name: t('propertyDashboard.afn', 'AFN'),
                  collected: selectedProject.rent.collectedAfn,
                  remaining: selectedProject.rent.remainingAfn,
              },
              {
                  name: t('propertyDashboard.usd', 'USD'),
                  collected: selectedProject.rent.collectedUsd,
                  remaining: selectedProject.rent.remainingUsd,
              },
          ]
        : [];
    const occupancyPie = selectedProject
        ? [
              {
                  name: t('propertyDashboard.occupied', 'Occupied'),
                  value: selectedProject.occupiedShops,
                  color: COLORS.green,
              },
              {
                  name: t('propertyDashboard.available', 'Available'),
                  value: selectedProject.availableShops,
                  color: COLORS.mist,
              },
          ]
        : [];
    const hasOverallChart = overallProjectChart.some(
        (item) => item.expenses !== 0 || item.cash !== 0,
    );
    const hasOverallPie = overallPie.some((item) => item.value > 0);
    const hasProjectRent = projectRentChart.some(
        (item) => item.collected !== 0 || item.remaining !== 0,
    );
    const hasOccupancy = occupancyPie.some((item) => item.value > 0);

    return (
        <AppLayout>
            <Head title={t('propertyDashboard.title', 'Property dashboard')} />

            <div className="mx-auto w-full max-w-[1680px] rounded-[26px] border border-[#dfe7e9] bg-[#f8fbfb] p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-[#d3a450] uppercase">
                            {t(
                                'propertyDashboard.eyebrow',
                                'Portfolio reporting',
                            )}
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-[#002452] dark:text-white">
                            {t(
                                'propertyDashboard.title',
                                'Markets and properties',
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {t(
                                'propertyDashboard.subtitle',
                                'Overall and property-level rent, occupancy, staff and expense reporting.',
                            )}
                        </p>
                    </div>
                    <button className="h-11 rounded-xl bg-[#002452] px-5 text-sm font-semibold text-white hover:bg-[#001a3d]">
                        + {t('propertyDashboard.newRecord', 'New record')}
                    </button>
                </div>

                <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-[#eef2f7] p-1.5">
                    <button
                        onClick={() => setActiveTab('overall')}
                        className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                            activeTab === 'overall'
                                ? 'bg-white text-[#002452] dark:bg-neutral-900 dark:text-white'
                                : 'text-slate-500 hover:text-[#002452]'
                        }`}
                    >
                        {t('propertyDashboard.overall', 'Overall statistics')}
                    </button>
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => setActiveTab(String(project.id))}
                            className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                                activeTab === String(project.id)
                                    ? 'bg-white text-[#002452] dark:bg-neutral-900 dark:text-white'
                                    : 'text-slate-500 hover:text-[#002452]'
                            }`}
                        >
                            {project.name}
                        </button>
                    ))}
                </div>

                {activeTab === 'overall' ? (
                    <div className="mt-5 space-y-5">
                        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <StatCard
                                label={t(
                                    'propertyDashboard.totalProjects',
                                    'Total properties',
                                )}
                                value={formatNumber(
                                    data.portfolio.totalProjects,
                                )}
                                icon={Building2}
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.activeProjects',
                                    'Active properties',
                                )}
                                value={formatNumber(
                                    data.portfolio.activeProjects,
                                )}
                                icon={Store}
                                accent="green"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.totalFloors',
                                    'Total floors',
                                )}
                                value={formatNumber(data.portfolio.totalFloors)}
                                icon={Layers3}
                                accent="blue"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.totalShops',
                                    'Total shops',
                                )}
                                value={formatNumber(data.portfolio.totalShops)}
                                icon={DoorOpen}
                                accent="coral"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.registeredTenants',
                                    'Registered tenants',
                                )}
                                value={formatNumber(
                                    data.portfolio.registeredTenants,
                                )}
                                icon={UsersRound}
                                accent="green"
                            />
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
                            <div className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="mb-5">
                                    <h2 className="font-bold text-[#002452] dark:text-white">
                                        {t(
                                            'propertyDashboard.projectPerformance',
                                            'Property performance',
                                        )}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {t(
                                            'propertyDashboard.projectPerformanceHelp',
                                            'Cash position and approved expenses by property',
                                        )}
                                    </p>
                                </div>
                                <div className="h-80" dir="ltr">
                                    {hasOverallChart ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={overallProjectChart}
                                                barGap={6}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="#eef2f7"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: '#64748b',
                                                    }}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: '#64748b',
                                                    }}
                                                    tickFormatter={(value) =>
                                                        formatNumber(value)
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value: number,
                                                    ) =>
                                                        `${formatPrice(value)} ؋`
                                                    }
                                                />
                                                <Legend />
                                                <Bar
                                                    name={t(
                                                        'propertyDashboard.cashPosition',
                                                        'Cash position',
                                                    )}
                                                    dataKey="cash"
                                                    fill={COLORS.teal}
                                                    radius={[6, 6, 0, 0]}
                                                />
                                                <Bar
                                                    name={t(
                                                        'propertyDashboard.expenses',
                                                        'Expenses',
                                                    )}
                                                    dataKey="expenses"
                                                    fill={COLORS.coral}
                                                    radius={[6, 6, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyChart
                                            label={t(
                                                'propertyDashboard.noFinanceData',
                                                'No financial records are available yet.',
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                <h2 className="font-bold text-[#002452] dark:text-white">
                                    {t(
                                        'propertyDashboard.portfolioStatus',
                                        'Portfolio status',
                                    )}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t(
                                        'propertyDashboard.portfolioStatusHelp',
                                        'Active and inactive properties',
                                    )}
                                </p>
                                <div className="mt-5 h-80" dir="ltr">
                                    {hasOverallPie ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={overallPie}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={62}
                                                    outerRadius={98}
                                                    paddingAngle={4}
                                                >
                                                    {overallPie.map((item) => (
                                                        <Cell
                                                            key={item.name}
                                                            fill={item.color}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(
                                                        value: number,
                                                    ) => formatNumber(value)}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyChart
                                            label={t(
                                                'propertyDashboard.noProjectData',
                                                'No property records are available yet.',
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                            <h2 className="font-bold text-[#002452] dark:text-white">
                                {t('propertyDashboard.projects', 'Properties')}
                            </h2>
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="text-slate-400">
                                        <tr className="border-b border-[#edf1f2] text-start dark:border-neutral-800">
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.project',
                                                    'Property',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.shops',
                                                    'Shops',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.tenants',
                                                    'Tenants',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.expenses',
                                                    'Expenses',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.status',
                                                    'Status',
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((project) => (
                                            <tr
                                                key={project.id}
                                                className="border-b border-[#f0f3f4] last:border-0 dark:border-neutral-800"
                                            >
                                                <td className="px-3 py-4">
                                                    <strong>
                                                        {project.name}
                                                    </strong>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {project.address || '—'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-4">
                                                    {formatNumber(
                                                        project.shops,
                                                    )}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {formatNumber(
                                                        project.registeredTenants,
                                                    )}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {formatPrice(
                                                        project.expensesAfn,
                                                    )}{' '}
                                                    ؋
                                                </td>
                                                <td className="px-3 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${project.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}
                                                    >
                                                        {project.isActive
                                                            ? t(
                                                                  'propertyDashboard.active',
                                                                  'Active',
                                                              )
                                                            : t(
                                                                  'propertyDashboard.inactive',
                                                                  'Inactive',
                                                              )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                ) : selectedProject ? (
                    <div className="mt-5 space-y-5">
                        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <StatCard
                                label={t('propertyDashboard.floors', 'Floors')}
                                value={formatNumber(selectedProject.floors)}
                                icon={Layers3}
                            />
                            <StatCard
                                label={t('propertyDashboard.shops', 'Shops')}
                                value={formatNumber(selectedProject.shops)}
                                icon={DoorOpen}
                                accent="blue"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.occupied',
                                    'Occupied shops',
                                )}
                                value={formatNumber(
                                    selectedProject.occupiedShops,
                                )}
                                icon={Store}
                                accent="green"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.available',
                                    'Available shops',
                                )}
                                value={formatNumber(
                                    selectedProject.availableShops,
                                )}
                                icon={Building2}
                                accent="coral"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.tenants',
                                    'Tenants',
                                )}
                                value={formatNumber(
                                    selectedProject.registeredTenants,
                                )}
                                icon={UsersRound}
                                accent="green"
                            />
                        </section>

                        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                            <MoneyCard
                                title={t(
                                    'propertyDashboard.collectedRentAfn',
                                    'Collected rent in AFN',
                                )}
                                collected={selectedProject.rent.collectedAfn}
                                remaining={selectedProject.rent.remainingAfn}
                                currency="؋"
                                t={t}
                            />
                            <MoneyCard
                                title={t(
                                    'propertyDashboard.collectedRentUsd',
                                    'Collected rent in USD',
                                )}
                                collected={selectedProject.rent.collectedUsd}
                                remaining={selectedProject.rent.remainingUsd}
                                currency="$"
                                t={t}
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.expenses',
                                    'Approved expenses',
                                )}
                                value={`${formatPrice(selectedProject.expensesAfn)} ؋`}
                                icon={ReceiptText}
                                accent="coral"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.cashPosition',
                                    'Cash position',
                                )}
                                value={`${formatPrice(selectedProject.cashPositionAfn)} ؋`}
                                icon={CircleDollarSign}
                                accent="teal"
                            />
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                            <div className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                <h2 className="font-bold text-[#002452] dark:text-white">
                                    {t(
                                        'propertyDashboard.rentCollection',
                                        'Rent collection',
                                    )}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t(
                                        'propertyDashboard.rentCollectionHelp',
                                        'Collected and remaining rent for last month',
                                    )}
                                </p>
                                <div className="mt-5 h-80" dir="ltr">
                                    {hasProjectRent ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart data={projectRentChart}>
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="#eef2f7"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) =>
                                                        formatNumber(value)
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value: number,
                                                    ) => formatPrice(value)}
                                                />
                                                <Legend />
                                                <Bar
                                                    name={t(
                                                        'propertyDashboard.collected',
                                                        'Collected',
                                                    )}
                                                    dataKey="collected"
                                                    fill={COLORS.green}
                                                    radius={[7, 7, 0, 0]}
                                                />
                                                <Bar
                                                    name={t(
                                                        'propertyDashboard.remaining',
                                                        'Remaining',
                                                    )}
                                                    dataKey="remaining"
                                                    fill={COLORS.coral}
                                                    radius={[7, 7, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyChart
                                            label={t(
                                                'propertyDashboard.noRentData',
                                                'Rent records will appear after the lease module is added.',
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                <h2 className="font-bold text-[#002452] dark:text-white">
                                    {t(
                                        'propertyDashboard.shopOccupancy',
                                        'Shop occupancy',
                                    )}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t(
                                        'propertyDashboard.shopOccupancyHelp',
                                        'Occupied and available shops',
                                    )}
                                </p>
                                <div className="mt-5 h-80" dir="ltr">
                                    {hasOccupancy ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={occupancyPie}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={4}
                                                >
                                                    {occupancyPie.map(
                                                        (item) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(
                                                        value: number,
                                                    ) => formatNumber(value)}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyChart
                                            label={t(
                                                'propertyDashboard.noShopData',
                                                'Shop records will appear after floors and shops are registered.',
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-[#002452] dark:text-white">
                                        {t(
                                            'propertyDashboard.marketExpenses',
                                            'Market expenses',
                                        )}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {t(
                                            'propertyDashboard.marketExpensesHelp',
                                            'Electricity, maintenance and other approved costs',
                                        )}
                                    </p>
                                </div>
                                <ReceiptText className="size-5 text-[#002452]" />
                            </div>
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-[680px] text-sm">
                                    <thead>
                                        <tr className="border-b border-[#edf1f2] text-slate-400 dark:border-neutral-800">
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.expense',
                                                    'Expense',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.date',
                                                    'Date',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.amount',
                                                    'Amount',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.status',
                                                    'Status',
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProject.recentExpenses
                                            .length ? (
                                            selectedProject.recentExpenses.map(
                                                (expense) => (
                                                    <tr
                                                        key={expense.id}
                                                        className="border-b border-[#f0f3f4] last:border-0 dark:border-neutral-800"
                                                    >
                                                        <td className="px-3 py-4 font-semibold">
                                                            {expense.title}
                                                        </td>
                                                        <td className="px-3 py-4 text-slate-500">
                                                            {expense.date}
                                                        </td>
                                                        <td className="px-3 py-4 font-semibold">
                                                            {formatPrice(
                                                                expense.amount,
                                                            )}{' '}
                                                            ؋
                                                        </td>
                                                        <td className="px-3 py-4">
                                                            <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-semibold text-[#002452]">
                                                                {expense.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="py-12 text-center text-sm text-slate-400"
                                                >
                                                    {t(
                                                        'propertyDashboard.noExpenses',
                                                        'No expenses have been recorded for this property.',
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                ) : null}
            </div>
        </AppLayout>
    );
}
