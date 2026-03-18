'use client';

import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Branch, BreadcrumbItem } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    CalendarRange,
    ChevronRight,
    FileSpreadsheet,
    Printer,
    ScrollText,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reports', href: '/reports' },
];

const RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom' },
];

interface ReportFilters {
    range: string;
    startDate: string;
    endDate: string;
    branchId: number | null;
    module: string;
}

interface ReportCatalogItem {
    key: string;
    title: string;
    description: string;
    status: 'live' | 'planned';
}

interface ReportOverviewItem {
    key: string;
    title: string;
    primary: number;
    primaryLabel: string;
    secondary: number;
    secondaryLabel: string;
    secondaryFormat?: 'currency' | 'number';
    primaryFormat?: 'currency' | 'number';
}

interface ReportColumn {
    key: string;
    label: string;
}

interface ReportSummaryItem {
    label: string;
    value: number;
    format: 'currency' | 'number';
}

interface ActiveReport {
    key: string;
    title: string;
    description: string;
    isReady: boolean;
    status: 'live' | 'planned';
    columns?: ReportColumn[];
    rows?: Array<Record<string, string | number>>;
    summary?: ReportSummaryItem[];
    statusBreakdown?: Array<{ label: string; value: number }>;
    branchBreakdown?: Array<{
        branch: string;
        orders: number;
        revenue: number;
    }>;
    topProducts?: Array<{ name: string; quantity: number }>;
    exportNotes?: string[];
    highlights?: string[];
}

interface ReportsPageProps {
    branches: Branch[];
    filters: ReportFilters;
    reportCatalog: ReportCatalogItem[];
    overview: ReportOverviewItem[];
    activeReport: ActiveReport;
    period: {
        label: string;
        startDate: string;
        endDate: string;
    };
}

function formatMetric(value: number, format: 'currency' | 'number' = 'number') {
    return format === 'currency' ? formatAfn(value) : formatNumber(value);
}

function buildParams(filters: {
    range: string;
    startDate: string;
    endDate: string;
    branchId: string;
    module: string;
}) {
    const params: Record<string, string> = {
        range: filters.range,
        module: filters.module,
    };

    if (filters.range === 'custom') {
        params.start_date = filters.startDate;
        params.end_date = filters.endDate;
    }

    if (filters.branchId) {
        params.branch_id = filters.branchId;
    }

    return params;
}

function statusVariant(status: 'live' | 'planned') {
    return status === 'live' ? 'success' : 'outline';
}

export default function ReportsPage({
    branches,
    filters,
    reportCatalog,
    overview,
    activeReport,
    period,
}: ReportsPageProps) {
    const [range, setRange] = useState(filters.range);
    const [startDate, setStartDate] = useState(filters.startDate);
    const [endDate, setEndDate] = useState(filters.endDate);
    const [branchId, setBranchId] = useState(
        filters.branchId?.toString() ?? '',
    );
    const [module, setModule] = useState(filters.module);

    const branchOptions = [
        { value: '', label: 'All Branches' },
        ...branches.map((branch) => ({
            value: String(branch.id),
            label: branch.name,
        })),
    ];

    const moduleOptions = reportCatalog.map((item) => ({
        value: item.key,
        label: item.title,
    }));

    const applyFilters = () => {
        router.get(
            '/reports',
            buildParams({
                range,
                startDate,
                endDate,
                branchId,
                module,
            }),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openModule = (nextModule: string) => {
        setModule(nextModule);

        router.get(
            '/reports',
            buildParams({
                range,
                startDate,
                endDate,
                branchId,
                module: nextModule,
            }),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const exportCsv = () => {
        if (
            !activeReport.isReady ||
            !activeReport.columns ||
            !activeReport.rows
        ) {
            return;
        }

        const headers = activeReport.columns.map((column) => column.label);
        const rows = activeReport.rows.map((row) =>
            activeReport
                .columns!.map(
                    (column) =>
                        `"${String(row[column.key] ?? '').replaceAll('"', '""')}"`,
                )
                .join(','),
        );

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeReport.key}-report-${period.startDate}-to-${period.endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const printReport = () => {
        if (
            !activeReport.isReady ||
            !activeReport.columns ||
            !activeReport.rows
        ) {
            return;
        }

        const summaryHtml = (activeReport.summary ?? [])
            .map(
                (item) => `
                    <div class="metric">
                        <div class="metric-label">${item.label}</div>
                        <div class="metric-value">${formatMetric(item.value, item.format)}</div>
                    </div>
                `,
            )
            .join('');

        const headerHtml = activeReport.columns
            .map((column) => `<th>${column.label}</th>`)
            .join('');

        const rowsHtml = activeReport.rows
            .map(
                (row) => `
                    <tr>
                        ${activeReport
                            .columns!.map(
                                (column) =>
                                    `<td>${String(row[column.key] ?? '-')}</td>`,
                            )
                            .join('')}
                    </tr>
                `,
            )
            .join('');

        const printWindow = window.open('', '_blank', 'width=1200,height=900');
        if (!printWindow) {
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>${activeReport.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 24px; color: #102f33; }
                        h1 { margin: 0 0 8px; font-size: 26px; }
                        p { margin: 0 0 18px; color: #4b5f63; }
                        .meta { margin-bottom: 20px; font-size: 13px; color: #4b5f63; }
                        .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
                        .metric { border: 1px solid #d7e3e2; border-radius: 12px; padding: 12px; }
                        .metric-label { font-size: 12px; color: #5f7678; margin-bottom: 4px; }
                        .metric-value { font-size: 18px; font-weight: 700; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #d7e3e2; padding: 8px; text-align: left; }
                        th { background: #eff6f6; }
                    </style>
                </head>
                <body>
                    <h1>${activeReport.title}</h1>
                    <p>${activeReport.description}</p>
                    <div class="meta">Reporting period: ${period.label}</div>
                    <div class="metrics">${summaryHtml}</div>
                    <table>
                        <thead><tr>${headerHtml}</tr></thead>
                        <tbody>${rowsHtml}</tbody>
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="space-y-4 py-2">
                <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#eef7f3_0%,#fff7e8_48%,#ffffff_100%)] p-5 dark:border-neutral-800 dark:bg-neutral-950 dark:bg-none">
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe2dc] bg-white/80 px-3 py-1 text-sm text-[#20464b]">
                                <ScrollText className="h-4 w-4" />
                                Central reporting workspace
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-[#102f33] dark:text-white">
                                    Dedicated Reports section
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-[#47676b] dark:text-neutral-300">
                                    Yes, this should be a separate section.
                                    Reports are a cross-module workflow, not
                                    just another action button inside Orders or
                                    Inventory. This hub gives us one place for
                                    date filters, branch scope, export actions,
                                    and reusable report layouts.
                                </p>
                            </div>
                        </div>

                        <Card className="border-white/80 bg-white/90 shadow-none dark:border-white/10 dark:bg-neutral-900">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Design rollout
                                </CardTitle>
                                <CardDescription>
                                    Built to expand one report family at a time.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
                                    <span>Live now</span>
                                    <Badge variant="success">
                                        Orders report
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
                                    <span>Next recommended</span>
                                    <span className="font-medium text-foreground">
                                        Inventory
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
                                    <span>Exports</span>
                                    <span className="font-medium text-foreground">
                                        Print, PDF via print, Excel CSV
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <Card className="shadow-none">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            Report controls
                        </CardTitle>
                        <CardDescription>
                            Select the report family, period, and branch scope
                            before generating output.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 lg:grid-cols-5">
                        <SearchableDropdown
                            value={module}
                            options={moduleOptions}
                            onValueChange={setModule}
                            placeholder="Select report"
                        />
                        <SearchableDropdown
                            value={range}
                            options={RANGE_OPTIONS}
                            onValueChange={setRange}
                            placeholder="Select range"
                        />
                        <SearchableDropdown
                            value={branchId}
                            options={branchOptions}
                            onValueChange={setBranchId}
                            placeholder="Select branch"
                        />
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(event.target.value)
                            }
                            disabled={range !== 'custom'}
                        />
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                                disabled={range !== 'custom'}
                            />
                            <Button className="shrink-0" onClick={applyFilters}>
                                Apply
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {overview.map((item) => {
                        const catalogItem = reportCatalog.find(
                            (entry) => entry.key === item.key,
                        );

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => openModule(item.key)}
                                className={cn(
                                    'rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#bdd3cb] hover:bg-[#fbfdfc]',
                                    filters.module === item.key
                                        ? 'border-[#8cb4a6] bg-[#f4fbf8]'
                                        : 'border-neutral-200 bg-white',
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-[#102f33]">
                                        {item.title}
                                    </h2>
                                    <Badge
                                        variant={statusVariant(
                                            catalogItem?.status ?? 'planned',
                                        )}
                                    >
                                        {(
                                            catalogItem?.status ?? 'planned'
                                        ).toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="mt-4 text-2xl font-semibold text-[#102f33]">
                                    {formatMetric(
                                        item.primary,
                                        item.primaryFormat ?? 'number',
                                    )}
                                </p>
                                <p className="text-sm text-[#547074]">
                                    {item.primaryLabel}
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm text-[#35565a]">
                                    <span>
                                        {item.secondaryLabel}:{' '}
                                        {formatMetric(
                                            item.secondary,
                                            item.secondaryFormat ?? 'number',
                                        )}
                                    </span>
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </button>
                        );
                    })}
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
                    <Card className="shadow-none">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl">
                                            {activeReport.title}
                                        </CardTitle>
                                        <Badge
                                            variant={statusVariant(
                                                activeReport.status,
                                            )}
                                        >
                                            {activeReport.status === 'live'
                                                ? 'Ready'
                                                : 'Planned'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-1 max-w-2xl">
                                        {activeReport.description}
                                    </CardDescription>
                                </div>

                                {activeReport.isReady ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                            onClick={printReport}
                                        >
                                            <Printer className="h-4 w-4" />
                                            Print / Save PDF
                                        </Button>
                                        <Button
                                            className="gap-2"
                                            onClick={exportCsv}
                                        >
                                            <FileSpreadsheet className="h-4 w-4" />
                                            Excel CSV
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarRange className="h-4 w-4" />
                                Reporting period: {period.label}
                            </div>

                            {activeReport.isReady ? (
                                <>
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        {(activeReport.summary ?? []).map(
                                            (item) => (
                                                <div
                                                    key={item.label}
                                                    className="rounded-2xl border bg-[#fcfdfd] p-4"
                                                >
                                                    <p className="text-xs tracking-[0.18em] text-[#708689] uppercase">
                                                        {item.label}
                                                    </p>
                                                    <p className="mt-2 text-2xl font-semibold text-[#102f33]">
                                                        {formatMetric(
                                                            item.value,
                                                            item.format,
                                                        )}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    <div className="rounded-2xl border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {(
                                                        activeReport.columns ??
                                                        []
                                                    ).map((column) => (
                                                        <TableHead
                                                            key={column.key}
                                                        >
                                                            {column.label}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(activeReport.rows ?? [])
                                                    .length > 0 ? (
                                                    (
                                                        activeReport.rows ?? []
                                                    ).map((row, index) => (
                                                        <TableRow
                                                            key={`${row.reference ?? index}`}
                                                        >
                                                            {(
                                                                activeReport.columns ??
                                                                []
                                                            ).map((column) => (
                                                                <TableCell
                                                                    key={
                                                                        column.key
                                                                    }
                                                                >
                                                                    {column.key ===
                                                                        'total' ||
                                                                    column.key ===
                                                                        'paid'
                                                                        ? formatAfn(
                                                                              Number(
                                                                                  row[
                                                                                      column
                                                                                          .key
                                                                                  ] ??
                                                                                      0,
                                                                              ),
                                                                          )
                                                                        : String(
                                                                              row[
                                                                                  column
                                                                                      .key
                                                                              ] ??
                                                                                  '-',
                                                                          )}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={
                                                                (
                                                                    activeReport.columns ??
                                                                    []
                                                                ).length || 1
                                                            }
                                                            className="py-10 text-center text-muted-foreground"
                                                        >
                                                            No rows matched this
                                                            date range.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-3xl border border-dashed p-6">
                                    <p className="text-sm text-muted-foreground">
                                        This report type has been designed and
                                        reserved in the reporting architecture.
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        {(activeReport.highlights ?? []).map(
                                            (item) => (
                                                <div
                                                    key={item}
                                                    className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm"
                                                >
                                                    {item}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Status breakdown
                                </CardTitle>
                                <CardDescription>
                                    Quick distribution for the selected report
                                    window.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {activeReport.isReady ? (
                                    (activeReport.statusBreakdown ?? []).map(
                                        (item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-2xl border px-3 py-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.label}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {formatNumber(
                                                            item.value,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Summary widgets will appear here when
                                        this report goes live.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Branch performance
                                </CardTitle>
                                <CardDescription>
                                    Highest-performing branches inside the
                                    selected window.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {activeReport.isReady ? (
                                    (activeReport.branchBreakdown ?? [])
                                        .slice(0, 5)
                                        .map((item) => (
                                            <div
                                                key={item.branch}
                                                className="rounded-2xl border px-3 py-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">
                                                        {item.branch}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatNumber(
                                                            item.orders,
                                                        )}{' '}
                                                        orders
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-[#2f5559]">
                                                    {formatAfn(item.revenue)}
                                                </p>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Branch-level comparisons will appear
                                        here.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Export notes
                                </CardTitle>
                                <CardDescription>
                                    How this report can be used operationally
                                    today.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(
                                    activeReport.exportNotes ??
                                    activeReport.highlights ??
                                    []
                                ).map((note) => (
                                    <div
                                        key={note}
                                        className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm"
                                    >
                                        {note}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {activeReport.isReady &&
                        (activeReport.topProducts ?? []).length > 0 ? (
                            <Card className="shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Top products
                                    </CardTitle>
                                    <CardDescription>
                                        Best-selling items in the selected
                                        period.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {(activeReport.topProducts ?? []).map(
                                        (item) => (
                                            <div
                                                key={item.name}
                                                className="rounded-2xl border px-3 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="font-medium">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatNumber(
                                                            item.quantity,
                                                        )}{' '}
                                                        qty
                                                    </span>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
