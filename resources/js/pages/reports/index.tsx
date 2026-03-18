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
    FileText,
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
    currencyColumns?: string[];
    rows?: Array<Record<string, string | number>>;
    summary?: ReportSummaryItem[];
    insights?: Array<{
        title: string;
        description: string;
        items: Array<{
            label: string;
            value: string;
            meta?: string;
        }>;
    }>;
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

function statusVariant(status: 'live' | 'planned'): 'success' | 'outline' {
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

    const downloadExport = (format: 'pdf' | 'xlsx') => {
        if (!activeReport.isReady || !activeReport.columns) {
            return;
        }

        const params = new URLSearchParams(
            buildParams({
                range,
                startDate,
                endDate,
                branchId,
                module,
            }),
        );

        window.location.href = `/reports/export/${format}?${params.toString()}`;
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
                                        Orders, Inventory, Finance, Products,
                                        Employees, Branches, Users
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
                                    <span>Next recommended</span>
                                    <span className="font-medium text-foreground">
                                        Export upgrades
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

                <section className="grid gap-4 xl:grid-cols-12">
                    <Card className="min-w-0 shadow-none xl:col-span-8">
                        <CardHeader className="pb-3">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                                <div className="min-w-0">
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
                                    <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                                        <Button
                                            variant="outline"
                                            className="gap-2 whitespace-nowrap"
                                            onClick={() =>
                                                downloadExport('pdf')
                                            }
                                        >
                                            <FileText className="h-4 w-4" />
                                            Download PDF
                                        </Button>
                                        <Button
                                            className="gap-2 whitespace-nowrap"
                                            onClick={() =>
                                                downloadExport('xlsx')
                                            }
                                        >
                                            <FileSpreadsheet className="h-4 w-4" />
                                            Download Excel
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
                                            (item, index) => (
                                                <div
                                                    key={`${activeReport.key}-summary-${index}-${item.label}`}
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

                                    <div className="overflow-hidden rounded-2xl border">
                                        <div className="max-h-[36rem] overflow-auto">
                                            <Table className="min-w-[960px]">
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
                                                            activeReport.rows ??
                                                            []
                                                        ).map((row, index) => (
                                                            <TableRow
                                                                key={`${row.reference ?? index}`}
                                                            >
                                                                {(
                                                                    activeReport.columns ??
                                                                    []
                                                                ).map(
                                                                    (
                                                                        column,
                                                                    ) => (
                                                                        <TableCell
                                                                            key={
                                                                                column.key
                                                                            }
                                                                        >
                                                                            {activeReport.currencyColumns?.includes(
                                                                                column.key,
                                                                            )
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
                                                                    ),
                                                                )}
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={
                                                                    (
                                                                        activeReport.columns ??
                                                                        []
                                                                    ).length ||
                                                                    1
                                                                }
                                                                className="py-10 text-center text-muted-foreground"
                                                            >
                                                                No rows matched
                                                                this date range.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
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
                                            (item, index) => (
                                                <div
                                                    key={`${activeReport.key}-highlight-${index}`}
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

                    <div className="min-w-0 space-y-4 xl:col-span-4">
                        {activeReport.isReady
                            ? (activeReport.insights ?? []).map(
                                  (section, sectionIndex) => (
                                      <Card
                                          className="shadow-none"
                                          key={`${activeReport.key}-insight-${sectionIndex}-${section.title}`}
                                      >
                                          <CardHeader className="pb-3">
                                              <CardTitle className="text-base">
                                                  {section.title}
                                              </CardTitle>
                                              <CardDescription>
                                                  {section.description}
                                              </CardDescription>
                                          </CardHeader>
                                          <CardContent className="space-y-3">
                                              {section.items.length > 0 ? (
                                                  section.items.map(
                                                      (item, itemIndex) => (
                                                          <div
                                                              key={`${activeReport.key}-insight-item-${sectionIndex}-${itemIndex}-${item.label}`}
                                                              className="rounded-2xl border px-3 py-3"
                                                          >
                                                              <div className="flex items-center justify-between gap-3">
                                                                  <span className="font-medium">
                                                                      {
                                                                          item.label
                                                                      }
                                                                  </span>
                                                                  <span className="text-sm text-muted-foreground">
                                                                      {
                                                                          item.value
                                                                      }
                                                                  </span>
                                                              </div>
                                                              {item.meta ? (
                                                                  <p className="mt-1 text-sm text-[#2f5559]">
                                                                      {
                                                                          item.meta
                                                                      }
                                                                  </p>
                                                              ) : null}
                                                          </div>
                                                      ),
                                                  )
                                              ) : (
                                                  <div className="rounded-2xl border px-3 py-3 text-sm text-muted-foreground">
                                                      No insight rows matched
                                                      this report window.
                                                  </div>
                                              )}
                                          </CardContent>
                                      </Card>
                                  ),
                              )
                            : null}

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
                                ).map((note, index) => (
                                    <div
                                        key={`${activeReport.key}-note-${index}`}
                                        className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm"
                                    >
                                        {note}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
