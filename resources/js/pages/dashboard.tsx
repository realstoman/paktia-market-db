import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { formatNumber, formatPrice } from '@/utils/format';
import { Head, Link } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    CircleDollarSign,
    DoorOpen,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Printer,
    Layers3,
    Plus,
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

interface RentCollectionRow {
    id: number;
    receiptNumber: string;
    tenant?: string | null;
    shopNumber?: string | null;
    floor?: string | null;
    amount: number;
    currency: string;
    currencyCode?: string | null;
    paymentDate: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    paymentMethod: string;
}

type CurrencyTotals = Record<string, number | string | undefined>;

interface ShareholderPnlRow {
    id: number;
    shareholder: string;
    property: string;
    percentage: number;
    revenue: number;
    expenses: number;
    net: number;
    allocated: number;
}

interface PortfolioProject {
    id: number;
    name: string;
    type: 'market' | 'mall' | 'block' | 'house' | 'commercial_unit';
    address?: string | null;
    isActive: boolean;
    floors: number;
    shops: number;
    occupiedShops: number;
    availableShops: number;
    registeredTenants: number;
    inventoryItems: number;
    employees: number;
    shareholders: number;
    rent: {
        collectedAfn: number;
        remainingAfn: number;
        collectedUsd: number;
        remainingUsd: number;
        collectedByCurrency?: CurrencyTotals;
    };
    financeThisMonth: {
        collectedRent: number;
        collectedRentByCurrency?: CurrencyTotals;
        expenses: number;
        expensesByCurrency?: CurrencyTotals;
        shareholderTakeouts: number;
        shareholderTakeoutsByCurrency?: CurrencyTotals;
        availableCash: number;
        availableCashByCurrency?: CurrencyTotals;
    };
    expensesAfn: number;
    expensesByCurrency?: CurrencyTotals;
    cashPositionAfn: number;
    cashPositionByCurrency?: CurrencyTotals;
    shareholderPnl?: ShareholderPnlRow[];
    recentRentCollections: RentCollectionRow[];
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
    mist: '#edf1f4',
};

function StatCard({
    label,
    value,
    icon: Icon,
    accent = 'teal',
    actionHref,
    actionLabel,
    currencyTotals,
}: {
    label: string;
    value: string;
    icon: typeof Building2;
    accent?: 'teal' | 'green' | 'coral' | 'blue';
    actionHref?: string;
    actionLabel?: string;
    currencyTotals?: CurrencyTotals;
}) {
    const tones = {
        teal: 'bg-[#edf1f4] text-[#002452]',
        green: 'bg-[#edf1f4] text-[#002452]',
        coral: 'bg-[#edf1f4] text-[#002452]',
        blue: 'bg-[#edf1f4] text-[#002452]',
    };

    return (
        <div
            className={`relative flex items-center gap-4 rounded-2xl border border-[#dfe7e9] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${
                actionHref ? 'pb-11' : ''
            }`}
        >
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[accent]}`}
                >
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-500">{label}</p>
                    {currencyTotals ? (
                        <div className="mt-1 space-y-1">
                            {currencyRows(currencyTotals).map((row) => (
                                <div
                                    key={row.code}
                                    className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900 dark:text-white"
                                >
                                    <span>{row.symbol}</span>
                                    <span dir="ltr">
                                        {formatPrice(row.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                            {value}
                        </p>
                    )}
                </div>
            </div>
            {actionHref && actionLabel ? (
                <Link
                    href={actionHref}
                    aria-label={actionLabel}
                    title={actionLabel}
                    className="absolute bottom-3 left-3 inline-flex size-8 items-center justify-center rounded-full border border-[#002452]/15 bg-[#002452] text-white transition hover:bg-[#002452]/90"
                >
                    <ExternalLink className="size-3.5" />
                    <span className="sr-only">{actionLabel}</span>
                </Link>
            ) : null}
        </div>
    );
}

function currencySymbol(code: string) {
    const normalized = code.toUpperCase();

    if (normalized === 'USD') {
        return '$';
    }

    if (normalized === 'AFN') {
        return '؋';
    }

    return normalized;
}

function currencyRows(totals: CurrencyTotals = {}) {
    const normalized = Object.entries(totals).reduce<Record<string, number>>(
        (carry, [code, value]) => {
            const key = code.toUpperCase();
            carry[key] = Number(value ?? 0);

            return carry;
        },
        {},
    );
    const orderedCodes = [
        'AFN',
        'USD',
        ...Object.keys(normalized).filter(
            (code) => !['AFN', 'USD'].includes(code),
        ),
    ];

    return orderedCodes
        .filter((code, index) => index < 2 || Number(normalized[code] ?? 0) !== 0)
        .map((code) => ({
            code,
            symbol: currencySymbol(code),
            amount: Number(normalized[code] ?? 0),
        }));
}

function currencyTotalsText(totals: CurrencyTotals = {}) {
    return currencyRows(totals)
        .map((row) => `${formatPrice(row.amount)} ${row.symbol}`)
        .join(' / ');
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center rounded-xl bg-[#edf1f4] text-sm text-slate-400 dark:bg-neutral-950">
            {label}
        </div>
    );
}

function formatDateForQuery(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export default function Dashboard({ data }: { data: DashboardData }) {
    const { direction, t } = useLocalization();
    const [activeTab, setActiveTab] = useState<string>('overall');
    const projects = data.portfolio.projects;
    const selectedProject = projects.find(
        (project) => String(project.id) === activeTab,
    );
    const currentMonthFilters = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return {
            startDate: formatDateForQuery(monthStart),
            endDate: formatDateForQuery(monthEnd),
        };
    }, []);
    const rentCollectionsHref = selectedProject
        ? `/finance/rentals?${new URLSearchParams({
              property_id: String(selectedProject.id),
              start_date: currentMonthFilters.startDate,
              end_date: currentMonthFilters.endDate,
          }).toString()}`
        : '/finance/rentals';
    const propertyExpensesHref = selectedProject
        ? `/finance/expenses?${new URLSearchParams({
              property_id: String(selectedProject.id),
              start_date: currentMonthFilters.startDate,
              end_date: currentMonthFilters.endDate,
          }).toString()}`
        : '/finance/expenses';
    const selectedProjectHasShops = Number(selectedProject?.shops ?? 0) > 0;
    const selectedProjectHasShareholders =
        Number(selectedProject?.shareholders ?? 0) > 0 ||
        Boolean(selectedProject?.shareholderPnl?.length);

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
    const propertyCapacityChart = selectedProject
        ? [
              {
                  name: t('propertyDashboard.floors', 'Floors'),
                  value: selectedProject.floors,
                  color: COLORS.blue,
              },
              ...(selectedProjectHasShops
                  ? [
                        {
                            name: t('propertyDashboard.shops', 'Shops'),
                            value: selectedProject.shops,
                            color: COLORS.teal,
                        },
                        {
                            name: t(
                                'propertyDashboard.occupied',
                                'Occupied shops',
                            ),
                            value: selectedProject.occupiedShops,
                            color: COLORS.green,
                        },
                        {
                            name: t(
                                'propertyDashboard.available',
                                'Available shops',
                            ),
                            value: selectedProject.availableShops,
                            color: COLORS.coral,
                        },
                    ]
                  : []),
          ]
        : [];
    const propertyFinanceChart = selectedProject
        ? [
              {
                  name: t(
                      'propertyDashboard.totalCollectedRentThisMonth',
                      'Collected rent this month',
                  ),
                  value: selectedProject.financeThisMonth.collectedRent,
                  color: COLORS.green,
              },
              {
                  name: t(
                      'propertyDashboard.totalExpensesThisMonth',
                      'Expenses this month',
                  ),
                  value: selectedProject.financeThisMonth.expenses,
                  color: COLORS.coral,
              },
              ...(selectedProjectHasShareholders
                  ? [
                        {
                            name: t(
                                'propertyDashboard.totalShareholderTakeoutsThisMonth',
                                'Shareholder takeouts this month',
                            ),
                            value: selectedProject.financeThisMonth
                                .shareholderTakeouts,
                            color: COLORS.blue,
                        },
                    ]
                  : []),
              {
                  name: t(
                      'propertyDashboard.totalAvailableCash',
                      'Available cash',
                  ),
                  value: selectedProject.financeThisMonth.availableCash,
                  color: COLORS.teal,
              },
          ]
        : [];
    const hasOverallChart = overallProjectChart.some(
        (item) => item.expenses !== 0 || item.cash !== 0,
    );
    const hasOverallPie = overallPie.some((item) => item.value > 0);
    const hasProjectCapacity = propertyCapacityChart.some(
        (item) => item.value > 0,
    );
    const hasProjectFinance = propertyFinanceChart.some(
        (item) => item.value !== 0,
    );
    const overviewRows = useMemo(
        () =>
            projects.map((project) => ({
                id: project.id,
                name: project.name,
                address: project.address || '—',
                recentMonthRent: project.financeThisMonth.collectedRent,
                totalCollectedRent: project.rent.collectedAfn,
                totalExpenses: project.expensesAfn,
                status: project.isActive
                    ? t('propertyDashboard.active', 'Active')
                    : t('propertyDashboard.inactive', 'Inactive'),
                isActive: project.isActive,
            })),
        [projects, t],
    );
    const overviewExportColumns = useMemo(
        () => [
            t('propertyDashboard.propertyName', 'Property Name'),
            t('propertyDashboard.recentMonthRent', 'Recent month rent'),
            t('propertyDashboard.totalCollectedRent', 'Total collected rent'),
            t('propertyDashboard.totalExpenses', 'Total expenses'),
            t('propertyDashboard.status', 'Status'),
        ],
        [t],
    );
    const exportOverviewExcel = () => {
        const rows = overviewRows
            .map(
                (row) => `
                    <tr>
                        <td>${escapeHtml(row.name)}</td>
                        <td>${formatPrice(row.recentMonthRent)} ؋</td>
                        <td>${formatPrice(row.totalCollectedRent)} ؋</td>
                        <td>${formatPrice(row.totalExpenses)} ؋</td>
                        <td>${escapeHtml(row.status)}</td>
                    </tr>`,
            )
            .join('');
        const html = `
            <html dir="${direction}">
                <head>
                    <meta charset="utf-8" />
                </head>
                <body>
                    <table>
                        <thead>
                            <tr>
                                ${overviewExportColumns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </body>
            </html>`;

        downloadBlob(
            html,
            `properties-finance-overview-${formatDateForQuery(new Date())}.xls`,
            'application/vnd.ms-excel;charset=utf-8;',
        );
    };
    const exportOverviewPdf = () => {
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            return;
        }

        const title = t(
            'propertyDashboard.projectsFinanceOverview',
            'Properties finance overview',
        );
        const rows = overviewRows
            .map(
                (row) => `
                    <tr>
                        <td>
                            <strong>${escapeHtml(row.name)}</strong>
                            <div class="muted">${escapeHtml(row.address)}</div>
                        </td>
                        <td>${formatPrice(row.recentMonthRent)} ؋</td>
                        <td>${formatPrice(row.totalCollectedRent)} ؋</td>
                        <td>${formatPrice(row.totalExpenses)} ؋</td>
                        <td>${escapeHtml(row.status)}</td>
                    </tr>`,
            )
            .join('');

        printWindow.document.write(`
            <!doctype html>
            <html dir="${direction}">
                <head>
                    <meta charset="utf-8" />
                    <title>${escapeHtml(title)}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            color: #002452;
                            padding: 28px;
                        }
                        h1 {
                            margin: 0 0 18px;
                            font-size: 22px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 12px;
                        }
                        th, td {
                            border: 1px solid #dfe7e9;
                            padding: 10px;
                            text-align: ${direction === 'rtl' ? 'right' : 'left'};
                            vertical-align: top;
                        }
                        th {
                            background: #edf1f4;
                            font-weight: 700;
                        }
                        .muted {
                            margin-top: 4px;
                            color: #64748b;
                            font-size: 11px;
                        }
                    </style>
                </head>
                <body>
                    <h1>${escapeHtml(title)}</h1>
                    <table>
                        <thead>
                            <tr>
                                ${overviewExportColumns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <script>
                        window.onload = function () {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };
    const printableStyles = `
        @font-face { font-family: BahijNazanin; src: url('/fonts/bahij-nazanin.ttf') format('truetype'); font-weight: 400; }
        @font-face { font-family: BahijNazanin; src: url('/fonts/bahij-nazanin-bold.ttf') format('truetype'); font-weight: 700; }
        @font-face { font-family: Manrope; src: url('/fonts/Manrope-VariableFont_wght.ttf') format('truetype'); }
        body {
            font-family: ${direction === 'rtl' ? 'BahijNazanin' : 'Manrope'}, Arial, sans-serif;
            color: #002452;
            padding: 28px;
            background: #fff;
        }
        header {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            border-bottom: 2px solid #edf1f4;
            padding-bottom: 18px;
            margin-bottom: 18px;
        }
        h1 { margin: 0; font-size: 24px; }
        .muted { color: #64748b; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td {
            border: 1px solid #dfe7e9;
            padding: 9px;
            text-align: ${direction === 'rtl' ? 'right' : 'left'};
            vertical-align: top;
        }
        th { background: #edf1f4; font-weight: 700; }
        footer {
            margin-top: 28px;
            border-top: 1px solid #edf1f4;
            padding-top: 12px;
            color: #64748b;
            font-size: 11px;
        }
        @page { margin: 14mm; }
    `;
    const writePrintableReport = (title: string, table: string) => {
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            return;
        }

        const propertyName = selectedProject?.name ?? title;

        printWindow.document.write(`
            <!doctype html>
            <html dir="${direction}">
                <head>
                    <meta charset="utf-8" />
                    <title>${escapeHtml(title)}</title>
                    <style>${printableStyles}</style>
                </head>
                <body>
                    <header>
                        <div>
                            <h1>${escapeHtml(propertyName)}</h1>
                            <div class="muted">${escapeHtml(title)}</div>
                        </div>
                        <div class="muted">${formatDateForQuery(new Date())}</div>
                    </header>
                    ${table}
                    <footer>
                        ${escapeHtml(propertyName)} · ${escapeHtml(t('propertyDashboard.generatedBySystem', 'Generated from the property finance system'))}
                    </footer>
                    <script>window.onload = function () { window.print(); };</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };
    const exportSelectedRentPdf = () => {
        if (!selectedProject) {
            return;
        }

        const title = t(
            'propertyDashboard.rentCollectionReport',
            'Rent collection report',
        );
        const rows = selectedProject.recentRentCollections
            .map(
                (payment) => `
                    <tr>
                        <td>${escapeHtml(payment.receiptNumber)}</td>
                        <td>${escapeHtml(payment.shopNumber || '—')}</td>
                        <td>${escapeHtml(payment.tenant || '—')}</td>
                        <td>${escapeHtml(payment.paymentDate || '—')}</td>
                        <td>${formatPrice(payment.amount)} ${escapeHtml(payment.currency)}</td>
                        <td>${escapeHtml(payment.periodStart || '—')}${payment.periodEnd ? ` - ${escapeHtml(payment.periodEnd)}` : ''}</td>
                    </tr>`,
            )
            .join('');

        writePrintableReport(
            title,
            `<table>
                <thead>
                    <tr>
                        <th>${escapeHtml(t('propertyDashboard.receipt', 'Receipt'))}</th>
                        <th>${escapeHtml(t('propertyDashboard.shop', 'Shop'))}</th>
                        <th>${escapeHtml(t('propertyDashboard.tenant', 'Tenant'))}</th>
                        <th>${escapeHtml(t('propertyDashboard.date', 'Date'))}</th>
                        <th>${escapeHtml(t('propertyDashboard.amount', 'Amount'))}</th>
                        <th>${escapeHtml(t('propertyDashboard.period', 'Period'))}</th>
                    </tr>
                </thead>
                <tbody>${rows || `<tr><td colspan="6">${escapeHtml(t('propertyDashboard.noRecentRent', 'No rent has been collected for this property yet.'))}</td></tr>`}</tbody>
            </table>`,
        );
    };
    const exportSelectedShareholderPnlPdf = () => {
        if (!selectedProject) {
            return;
        }

        const title = t(
            'financeDashboard.shareholderPnl.title',
            'Shareholder Profit & Loss',
        );
        const rows = (selectedProject.shareholderPnl ?? [])
            .map(
                (row) => `
                    <tr>
                        <td>${escapeHtml(row.shareholder)}</td>
                        <td>${formatPrice(row.percentage)}%</td>
                        <td>${formatPrice(row.net)} ؋</td>
                        <td>${formatPrice(row.allocated)} ؋</td>
                    </tr>`,
            )
            .join('');

        writePrintableReport(
            title,
            `<table>
                <thead>
                    <tr>
                        <th>${escapeHtml(t('financeDashboard.shareholderPnl.shareholder', 'Shareholder'))}</th>
                        <th>${escapeHtml(t('financeDashboard.shareholderPnl.share', 'Share'))}</th>
                        <th>${escapeHtml(t('financeDashboard.shareholderPnl.net', 'Net'))}</th>
                        <th>${escapeHtml(t('financeDashboard.shareholderPnl.allocated', 'Allocated'))}</th>
                    </tr>
                </thead>
                <tbody>${rows || `<tr><td colspan="4">${escapeHtml(t('financeDashboard.shareholderPnl.empty', 'No effective shareholder assignments were found for this period.'))}</td></tr>`}</tbody>
            </table>`,
        );
    };

    return (
        <AppLayout>
            <Head title={t('propertyDashboard.title', 'Property dashboard')} />

            <div className="mx-auto w-full max-w-[1680px] bg-transparent dark:bg-neutral-950">
                <div>
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
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="property-tabs-scroll inline-flex w-max max-w-full min-w-0 gap-0.5 overflow-x-auto overscroll-x-contain scroll-smooth rounded-full bg-[#edf1f4] p-1 sm:max-w-250">
                        <button
                            onClick={() => setActiveTab('overall')}
                            className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-base font-medium transition-colors ${
                                activeTab === 'overall'
                                    ? 'border-slate-200/80 bg-white text-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
                                    : 'border-transparent text-slate-500 hover:text-brand-primary'
                            }`}
                        >
                            {t(
                                'propertyDashboard.overall',
                                'Overall statistics',
                            )}
                        </button>
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => setActiveTab(String(project.id))}
                                className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-base font-medium transition-colors ${
                                    activeTab === String(project.id)
                                        ? 'border-slate-200/80 bg-white text-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
                                        : 'border-transparent text-slate-500 hover:text-brand-primary'
                                }`}
                            >
                                {project.name}
                            </button>
                        ))}
                    </div>
                    <Link
                        href="/properties?create=1"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
                    >
                        <Plus className="size-4" />
                        {t('propertyWorkspace.register', 'Register property')}
                    </Link>
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
                                                    stroke="#edf1f4"
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
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-bold text-[#002452] dark:text-white">
                                        {t(
                                            'propertyDashboard.projectsFinanceOverview',
                                            'Properties finance overview',
                                        )}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {t(
                                            'propertyDashboard.projectsFinanceOverviewHelp',
                                            'Monthly rent, total collected rent, expenses, and status for each property.',
                                        )}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={exportOverviewPdf}
                                        className="inline-flex h-9 items-center gap-2 rounded-full border border-[#002452]/15 bg-white px-3 text-xs font-semibold text-[#002452] transition hover:bg-[#edf1f4] dark:bg-neutral-900 dark:text-white"
                                    >
                                        <FileText className="size-4" />
                                        {t(
                                            'propertyDashboard.downloadPdf',
                                            'PDF',
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={exportOverviewExcel}
                                        className="inline-flex h-9 items-center gap-2 rounded-full bg-[#002452] px-3 text-xs font-semibold text-white transition hover:bg-[#002452]/90"
                                    >
                                        <FileSpreadsheet className="size-4" />
                                        {t(
                                            'propertyDashboard.downloadExcel',
                                            'Excel',
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-190 text-sm">
                                    <thead className="text-slate-400">
                                        <tr className="border-b border-[#edf1f2] text-start dark:border-neutral-800">
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.propertyName',
                                                    'Property Name',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.recentMonthRent',
                                                    'Recent month rent',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.totalCollectedRent',
                                                    'Total collected rent',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.totalExpenses',
                                                    'Total expenses',
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
                                        {overviewRows.map((project) => (
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
                                                    {formatPrice(
                                                        project.recentMonthRent,
                                                    )}{' '}
                                                    ؋
                                                </td>
                                                <td className="px-3 py-4">
                                                    {formatPrice(
                                                        project.totalCollectedRent,
                                                    )}
                                                    ؋
                                                </td>
                                                <td className="px-3 py-4">
                                                    {formatPrice(
                                                        project.totalExpenses,
                                                    )}{' '}
                                                    ؋
                                                </td>
                                                <td className="px-3 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${project.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}
                                                    >
                                                        {project.status}
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
                        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                        </section>

                        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label={t(
                                    'propertyDashboard.totalCollectedRentThisMonth',
                                    'Collected rent this month',
                                )}
                                value={`${formatPrice(selectedProject.financeThisMonth.collectedRent)} ؋`}
                                icon={Banknote}
                                accent="green"
                                actionHref={rentCollectionsHref}
                                actionLabel={t(
                                    'propertyDashboard.viewCollectedRents',
                                    'View rents',
                                )}
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.totalExpensesThisMonth',
                                    'Expenses this month',
                                )}
                                value={`${formatPrice(selectedProject.financeThisMonth.expenses)} ؋`}
                                icon={ReceiptText}
                                accent="coral"
                                actionHref={propertyExpensesHref}
                                actionLabel={t(
                                    'propertyDashboard.viewExpenses',
                                    'View expenses',
                                )}
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.totalShareholderTakeoutsThisMonth',
                                    'Shareholder takeouts this month',
                                )}
                                value={`${formatPrice(selectedProject.financeThisMonth.shareholderTakeouts)} ؋`}
                                icon={UsersRound}
                                accent="blue"
                            />
                            <StatCard
                                label={t(
                                    'propertyDashboard.totalAvailableCash',
                                    'Available cash',
                                )}
                                value={`${formatPrice(selectedProject.financeThisMonth.availableCash)} ؋`}
                                icon={CircleDollarSign}
                                accent="teal"
                            />
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                            <div className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                <h2 className="font-bold text-[#002452] dark:text-white">
                                    {t(
                                        'propertyDashboard.monthlyFinanceChart',
                                        'Monthly finance overview',
                                    )}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t(
                                        'propertyDashboard.monthlyFinanceChartHelp',
                                        'Collected rent, expenses, shareholder takeouts and available cash for this month',
                                    )}
                                </p>
                                <div className="mt-5 h-80" dir="ltr">
                                    {hasProjectFinance ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={propertyFinanceChart}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="#edf1f4"
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
                                                    ) =>
                                                        `${formatPrice(value)} ؋`
                                                    }
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[7, 7, 0, 0]}
                                                >
                                                    {propertyFinanceChart.map(
                                                        (item) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyChart
                                            label={t(
                                                'propertyDashboard.noRentData',
                                                'Rent records will appear after rent is collected.',
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#dfe7e9] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                <h2 className="font-bold text-[#002452] dark:text-white">
                                    {t(
                                        'propertyDashboard.propertyStructureChart',
                                        'Property structure',
                                    )}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t(
                                        'propertyDashboard.propertyStructureChartHelp',
                                        'Floors, shops, taken shops and empty shops',
                                    )}
                                </p>
                                <div className="mt-5 h-80" dir="ltr">
                                    {hasProjectCapacity ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={propertyCapacityChart}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="#edf1f4"
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
                                                    allowDecimals={false}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) =>
                                                        formatNumber(value)
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value: number,
                                                    ) => formatNumber(value)}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[7, 7, 0, 0]}
                                                >
                                                    {propertyCapacityChart.map(
                                                        (item) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Bar>
                                            </BarChart>
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
                                            'propertyDashboard.recentCollectedRent',
                                            'Recent collected rent',
                                        )}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {t(
                                            'propertyDashboard.recentCollectedRentHelp',
                                            'Latest rent payments collected from shops and rented spaces',
                                        )}
                                    </p>
                                </div>
                                <Banknote className="size-5 text-[#002452]" />
                            </div>
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-170 text-sm">
                                    <thead>
                                        <tr className="border-b border-[#edf1f2] text-slate-400 dark:border-neutral-800">
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.receipt',
                                                    'Receipt',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.shop',
                                                    'Shop',
                                                )}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t(
                                                    'propertyDashboard.tenant',
                                                    'Tenant',
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
                                                    'propertyDashboard.period',
                                                    'Period',
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProject.recentRentCollections
                                            .length ? (
                                            selectedProject.recentRentCollections.map(
                                                (payment) => (
                                                    <tr
                                                        key={payment.id}
                                                        className="border-b border-[#f0f3f4] last:border-0 dark:border-neutral-800"
                                                    >
                                                        <td className="px-3 py-4 font-semibold">
                                                            {
                                                                payment.receiptNumber
                                                            }
                                                        </td>
                                                        <td className="px-3 py-4">
                                                            <strong>
                                                                {
                                                                    payment.shopNumber
                                                                }
                                                            </strong>
                                                            {payment.floor ? (
                                                                <p className="mt-1 text-xs text-slate-400">
                                                                    {
                                                                        payment.floor
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </td>
                                                        <td className="px-3 py-4 text-slate-500">
                                                            {payment.tenant ||
                                                                '—'}
                                                        </td>
                                                        <td className="px-3 py-4 text-slate-500">
                                                            {
                                                                payment.paymentDate
                                                            }
                                                        </td>
                                                        <td className="px-3 py-4 font-semibold">
                                                            {formatPrice(
                                                                payment.amount,
                                                            )}{' '}
                                                            {payment.currency}
                                                        </td>
                                                        <td className="px-3 py-4 text-slate-500">
                                                            {payment.periodStart ||
                                                                '—'}
                                                            {payment.periodEnd
                                                                ? ` - ${payment.periodEnd}`
                                                                : ''}
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-12 text-center text-sm text-slate-400"
                                                >
                                                    {t(
                                                        'propertyDashboard.noRecentRent',
                                                        'No rent has been collected for this property yet.',
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
