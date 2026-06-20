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
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { BreadcrumbItem, Property } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    type ColumnDef,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    BarChart3,
    CalendarRange,
    ChevronDown,
    ChevronRight,
    Columns3,
    FileSpreadsheet,
    FileText,
    Filter,
    Loader2,
    Save,
    Search,
    SlidersHorizontal,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';

const RANGE_OPTIONS = [
    { value: 'today', labelKey: 'reportPage.ranges.today', label: 'Today' },
    {
        value: 'yesterday',
        labelKey: 'reportPage.ranges.yesterday',
        label: 'Yesterday',
    },
    {
        value: 'this_week',
        labelKey: 'reportPage.ranges.this_week',
        label: 'This Week',
    },
    {
        value: 'this_month',
        labelKey: 'reportPage.ranges.this_month',
        label: 'This Month',
    },
    {
        value: 'last_30_days',
        labelKey: 'reportPage.ranges.last_30_days',
        label: 'Last 30 Days',
    },
    {
        value: 'year_to_date',
        labelKey: 'reportPage.ranges.year_to_date',
        label: 'Year to Date',
    },
    { value: 'custom', labelKey: 'reportPage.ranges.custom', label: 'Custom' },
] as const;

const QUICK_PRESETS = RANGE_OPTIONS.filter(
    (option) => option.value !== 'custom',
);
const SAVED_PRESETS_KEY = 'paktia-market-reports-saved-presets';
const CHART_COLORS = [
    '#123f46',
    '#1d6f7a',
    '#d3a450',
    '#d98900',
    '#6b8790',
    '#91b7bf',
];

interface ReportFilters {
    range: string;
    startDate: string;
    endDate: string;
    propertyId: number | null;
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

interface ActiveReportInsightItem {
    label: string;
    value: string;
    meta?: string;
}

interface ActiveReportInsight {
    title: string;
    description: string;
    items: ActiveReportInsightItem[];
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
    insights?: ActiveReportInsight[];
    exportNotes?: string[];
    highlights?: string[];
}

interface ReportsPageProps {
    properties: Property[];
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

interface SavedPreset {
    id: string;
    name: string;
    createdAt: string;
    filters: {
        range: string;
        startDate: string;
        endDate: string;
        propertyId: string;
        module: string;
    };
}

interface ChartPanel {
    title: string;
    description: string;
    type: 'bar' | 'pie';
    data: Array<Record<string, string | number>>;
    dataKey: string;
    labelKey: string;
}

type Translator = (key: string, fallback?: string) => string;

function formatMetric(value: number, format: 'currency' | 'number' = 'number') {
    return format === 'currency' ? formatAfn(value) : formatNumber(value);
}

function buildParams(filters: {
    range: string;
    startDate: string;
    endDate: string;
    propertyId: string;
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

    if (filters.propertyId) {
        params.property_id = filters.propertyId;
    }

    return params;
}

function statusVariant(status: 'live' | 'planned'): 'success' | 'outline' {
    return status === 'live' ? 'success' : 'outline';
}

function parseNumericValue(value: string | number | undefined) {
    if (typeof value === 'number') {
        return value;
    }

    if (!value) {
        return 0;
    }

    const normalized = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
}

function rangeLabel(range: string, t: Translator) {
    const option = RANGE_OPTIONS.find((item) => item.value === range);

    return option ? t(option.labelKey, option.label) : range;
}

function buildChartPanel(
    activeReport: ActiveReport,
    t: Translator,
): ChartPanel | null {
    const rows = activeReport.rows ?? [];
    const unknown = t('reportPage.chart.unknown', 'Unknown');

    if (!activeReport.isReady || rows.length === 0) {
        return null;
    }

    if (activeReport.key === 'inventory') {
        return {
            title: t('reportPage.chart.stockMovement', 'Stock movement'),
            description: t(
                'reportPage.chart.stockMovementDescription',
                'Highest absolute inventory movements in the selected window.',
            ),
            type: 'bar',
            data: rows
                .map((row) => ({
                    label: String(row.item ?? unknown),
                    value: Math.abs(parseNumericValue(row.quantity)),
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6),
            dataKey: 'value',
            labelKey: 'label',
        };
    }

    if (activeReport.key === 'finance') {
        const grouped = new Map<string, number>();

        for (const row of rows) {
            const key = String(row.source ?? unknown);
            grouped.set(
                key,
                (grouped.get(key) ?? 0) + parseNumericValue(row.amount),
            );
        }

        return {
            title: t('reportPage.chart.financialMix', 'Financial mix'),
            description: t(
                'reportPage.chart.financialMixDescription',
                'Value concentration across financial entry sources.',
            ),
            type: 'bar',
            data: Array.from(grouped.entries()).map(([label, value]) => ({
                label,
                value,
            })),
            dataKey: 'value',
            labelKey: 'label',
        };
    }

    if (activeReport.key === 'employees') {
        const grouped = new Map<string, number>();
        const unassigned = t('reportPage.chart.unassigned', 'Unassigned');

        for (const row of rows) {
            const key = String(row.employmentType ?? unassigned);
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
        }

        return {
            title: t('reportPage.chart.staffingMix', 'Staffing mix'),
            description: t(
                'reportPage.chart.staffingMixDescription',
                'Workforce distribution by employment type.',
            ),
            type: 'pie',
            data: Array.from(grouped.entries()).map(([name, value]) => ({
                name,
                value,
            })),
            dataKey: 'value',
            labelKey: 'name',
        };
    }

    if (activeReport.key === 'properties') {
        return {
            title: t('reportPage.chart.propertyRevenue', 'Market coverage'),
            description: t(
                'reportPage.chart.propertyRevenueDescription',
                'Top markets by report value.',
            ),
            type: 'bar',
            data: rows
                .map((row) => ({
                    label: String(row.property ?? unknown),
                    value:
                        parseNumericValue(row.employees) +
                        parseNumericValue(row.inventory),
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6),
            dataKey: 'value',
            labelKey: 'label',
        };
    }

    if (activeReport.key === 'users') {
        const grouped = new Map<string, number>();

        for (const row of rows) {
            const roles = String(row.roles ?? '-')
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean);

            for (const role of roles) {
                grouped.set(role, (grouped.get(role) ?? 0) + 1);
            }
        }

        return {
            title: t('reportPage.chart.roleMix', 'Role mix'),
            description: t(
                'reportPage.chart.roleMixDescription',
                'User distribution across assigned roles.',
            ),
            type: 'pie',
            data: Array.from(grouped.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6),
            dataKey: 'value',
            labelKey: 'name',
        };
    }

    return null;
}

export default function ReportsPage({
    properties,
    filters,
    reportCatalog,
    overview,
    activeReport,
    period,
}: ReportsPageProps) {
    const { can } = useAuthorization();
    const { isRtl, t } = useLocalization();
    const [range, setRange] = useState(filters.range);
    const [startDate, setStartDate] = useState(filters.startDate);
    const [endDate, setEndDate] = useState(filters.endDate);
    const [propertyId, setPropertyId] = useState(
        filters.propertyId?.toString() ?? '',
    );
    const [module, setModule] = useState(filters.module);
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
    const [exportingFormat, setExportingFormat] = useState<
        'pdf' | 'xlsx' | null
    >(null);
    const deferredSearch = useDeferredValue(search);
    const canExportReports = can('reports.export');
    const breadcrumbs = useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('reportPage.dashboard', 'Dashboard'),
                href: '/dashboard',
            },
            { title: t('reportPage.title', 'Reports'), href: '/reports' },
        ],
        [t],
    );
    const localizedRangeOptions = useMemo(
        () =>
            RANGE_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey, option.label),
            })),
        [t],
    );

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(SAVED_PRESETS_KEY);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as SavedPreset[];
            setSavedPresets(Array.isArray(parsed) ? parsed : []);
        } catch {
            setSavedPresets([]);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            SAVED_PRESETS_KEY,
            JSON.stringify(savedPresets),
        );
    }, [savedPresets]);

    useEffect(() => {
        setSearch('');
        setSorting([]);
        setColumnVisibility({});
    }, [activeReport.key]);

    const propertyOptions = [
        {
            value: '',
            label: t('reportPage.toolbar.allProperties', 'All markets'),
        },
        ...properties.map((property) => ({
            value: String(property.id),
            label: property.name,
        })),
    ];

    useAutoSelectSingleOption(
        properties.map((property) => ({
            value: String(property.id),
            label: property.name,
        })),
        propertyId,
        setPropertyId,
    );

    const moduleOptions = reportCatalog.map((item) => ({
        value: item.key,
        label: item.title,
    }));

    const activePropertyLabel =
        propertyOptions.find(
            (option) => option.value === (filters.propertyId?.toString() ?? ''),
        )?.label ?? t('reportPage.toolbar.allProperties', 'All markets');
    const hasPendingChanges =
        range !== filters.range ||
        startDate !== filters.startDate ||
        endDate !== filters.endDate ||
        propertyId !== (filters.propertyId?.toString() ?? '') ||
        module !== filters.module;

    const chartPanel = useMemo(
        () => buildChartPanel(activeReport, t),
        [activeReport, t],
    );

    const analysisColumns = useMemo<
        ColumnDef<Record<string, string | number>>[]
    >(
        () =>
            (activeReport.columns ?? []).map((column) => ({
                accessorKey: column.key,
                id: column.key,
                header: ({ column: tableColumn }) => (
                    <button
                        type="button"
                        onClick={tableColumn.getToggleSortingHandler()}
                        className="flex items-center gap-2 font-medium"
                    >
                        <span>{column.label}</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                ),
                cell: ({ row }) => {
                    const value = row.getValue(column.key) as string | number;

                    return activeReport.currencyColumns?.includes(column.key)
                        ? formatAfn(Number(value ?? 0))
                        : String(value ?? '-');
                },
            })),
        [activeReport.columns, activeReport.currencyColumns],
    );

    const table = useReactTable({
        data: activeReport.rows ?? [],
        columns: analysisColumns,
        state: {
            sorting,
            globalFilter: deferredSearch,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const query = String(filterValue ?? '')
                .trim()
                .toLowerCase();

            if (!query) {
                return true;
            }

            return Object.values(row.original).some((value) =>
                String(value ?? '')
                    .toLowerCase()
                    .includes(query),
            );
        },
    });

    const applyFilters = (next?: {
        range?: string;
        startDate?: string;
        endDate?: string;
        propertyId?: string;
        module?: string;
    }) => {
        const nextFilters = {
            range: next?.range ?? range,
            startDate: next?.startDate ?? startDate,
            endDate: next?.endDate ?? endDate,
            propertyId: next?.propertyId ?? propertyId,
            module: next?.module ?? module,
        };

        router.get('/reports', buildParams(nextFilters), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handlePresetSelect = (presetRange: string) => {
        setRange(presetRange);
    };

    const handleOverviewOpen = (nextModule: string) => {
        setModule(nextModule);
        applyFilters({ module: nextModule });
    };

    const saveCurrentPreset = () => {
        const defaultName = `${moduleOptions.find((option) => option.value === module)?.label ?? t('reportPage.title', 'Reports')} - ${rangeLabel(range, t)}`;
        const name = window
            .prompt(
                t('reportPage.toolbar.presetName', 'Preset name'),
                defaultName,
            )
            ?.trim();

        if (!name) {
            return;
        }

        const preset: SavedPreset = {
            id: `${Date.now()}`,
            name,
            createdAt: new Date().toISOString(),
            filters: {
                range,
                startDate,
                endDate,
                propertyId,
                module,
            },
        };

        setSavedPresets((current) => [preset, ...current].slice(0, 8));
        toast.success(
            t('reportPage.toolbar.presetSaved', 'Saved report preset.'),
        );
    };

    const applySavedPreset = (preset: SavedPreset) => {
        setRange(preset.filters.range);
        setStartDate(preset.filters.startDate);
        setEndDate(preset.filters.endDate);
        setPropertyId(preset.filters.propertyId);
        setModule(preset.filters.module);
        applyFilters(preset.filters);
        toast.success(
            t('reportPage.toolbar.presetLoaded', 'Loaded ":name".').replace(
                ':name',
                preset.name,
            ),
        );
    };

    const removeSavedPreset = (presetId: string) => {
        setSavedPresets((current) =>
            current.filter((item) => item.id !== presetId),
        );
        toast.success(
            t('reportPage.toolbar.presetRemoved', 'Removed saved preset.'),
        );
    };

    const downloadExport = async (format: 'pdf' | 'xlsx') => {
        if (!activeReport.isReady || !activeReport.columns) {
            return;
        }

        const params = new URLSearchParams(
            buildParams({
                range,
                startDate,
                endDate,
                propertyId,
                module,
            }),
        );

        const toastId = toast.loading(
            format === 'pdf'
                ? t('reportPage.export.generatingPdf', 'Generating PDF...')
                : t(
                      'reportPage.export.generatingExcel',
                      'Generating Excel export...',
                  ),
        );

        setExportingFormat(format);

        try {
            const response = await fetch(
                `/reports/export/${format}?${params.toString()}`,
            );

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const disposition = response.headers.get('content-disposition');
            const match = disposition?.match(/filename="?([^"]+)"?/i);
            const filename =
                match?.[1] ??
                `${activeReport.key}-report-${period.startDate}-to-${period.endDate}.${format}`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(
                format === 'pdf'
                    ? t('reportPage.export.pdfReady', 'PDF export is ready.')
                    : t(
                          'reportPage.export.excelReady',
                          'Excel export is ready.',
                      ),
                { id: toastId },
            );
        } catch {
            toast.error(
                t(
                    'reportPage.export.failed',
                    'Export failed. Please try again.',
                ),
                { id: toastId },
            );
        } finally {
            setExportingFormat(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reportPage.title', 'Reports')} />
            <div className={cn('space-y-5 py-2', isRtl && 'text-right')}>
                <section className="overflow-hidden rounded-[2rem] border border-[#d8e5e8] bg-[radial-gradient(circle_at_top_right,rgba(211,164,80,0.20),transparent_32%),linear-gradient(135deg,#edf1f4_0%,#f8f9fd_52%,#fff7e8_100%)] p-5 shadow-sm shadow-slate-950/[0.03] dark:border-neutral-800 dark:bg-neutral-950 dark:bg-none">
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe2dc] bg-white/80 px-3 py-1 text-sm text-[#20464b]">
                                <Sparkles className="h-4 w-4" />
                                {t(
                                    'reportPage.heroEyebrow',
                                    'Market analytics',
                                )}
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-brand-primary dark:text-white">
                                    {t(
                                        'reportPage.heroTitle',
                                        'Paktiawal reporting center',
                                    )}
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-[#47676b] dark:text-neutral-300">
                                    {t(
                                        'reportPage.heroDescription',
                                        'Review market, property, inventory, finance, employee and access reports in one organized workspace.',
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="success">
                                    {t(
                                        'reportPage.badges.liveFamilies',
                                        '5 live report families',
                                    )}
                                </Badge>
                                <Badge variant="outline">
                                    {t(
                                        'reportPage.badges.pdf',
                                        'True PDF export',
                                    )}
                                </Badge>
                                <Badge variant="outline">
                                    {t(
                                        'reportPage.badges.excel',
                                        'Native Excel .xlsx',
                                    )}
                                </Badge>
                                <Badge variant="outline">
                                    {t(
                                        'reportPage.badges.presets',
                                        'Saved presets',
                                    )}
                                </Badge>
                            </div>
                        </div>

                        <Card className="border-white/80 bg-white/90 shadow-sm shadow-slate-950/[0.03] dark:border-white/10 dark:bg-neutral-900">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {t(
                                        'reportPage.status.title',
                                        'Workspace status',
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'reportPage.status.description',
                                        'Built for repeat market reporting and fast management review.',
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe7e9] bg-[#f8f9fd] px-3 py-2">
                                    <span>
                                        {t(
                                            'reportPage.status.analysisMode',
                                            'Analysis mode',
                                        )}
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {t(
                                            'reportPage.status.analysisValue',
                                            'Search, sort, toggle columns',
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe7e9] bg-[#f8f9fd] px-3 py-2">
                                    <span>
                                        {t(
                                            'reportPage.status.activeReport',
                                            'Active report',
                                        )}
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {activeReport.title}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe7e9] bg-[#f8f9fd] px-3 py-2">
                                    <span>
                                        {t(
                                            'reportPage.status.period',
                                            'Period',
                                        )}
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {period.label}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <Card className="rounded-[1.75rem] border-[#dfe7e9] bg-white shadow-sm shadow-slate-950/[0.03]">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-lg">
                                    {t(
                                        'reportPage.toolbar.title',
                                        'Report filters',
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'reportPage.toolbar.description',
                                        'Choose a report, period and market scope, then generate or save the view.',
                                    )}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={saveCurrentPreset}
                                >
                                    <Save className="h-4 w-4" />
                                    {t(
                                        'reportPage.toolbar.saveView',
                                        'Save view',
                                    )}
                                </Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => applyFilters()}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {t(
                                        'reportPage.toolbar.generateReport',
                                        'Generate report',
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {QUICK_PRESETS.map((preset) => (
                                <Button
                                    key={preset.value}
                                    type="button"
                                    variant={
                                        range === preset.value
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="rounded-full"
                                    onClick={() =>
                                        handlePresetSelect(preset.value)
                                    }
                                >
                                    {t(preset.labelKey, preset.label)}
                                </Button>
                            ))}
                        </div>

                        <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr_0.8fr_auto]">
                            <SearchableDropdown
                                value={module}
                                options={moduleOptions}
                                onValueChange={setModule}
                                placeholder={t(
                                    'reportPage.toolbar.selectReport',
                                    'Select report',
                                )}
                            />
                            <SearchableDropdown
                                value={range}
                                options={localizedRangeOptions}
                                onValueChange={setRange}
                                placeholder={t(
                                    'reportPage.toolbar.selectRange',
                                    'Select range',
                                )}
                            />
                            <SearchableDropdown
                                value={propertyId}
                                options={propertyOptions}
                                onValueChange={setPropertyId}
                                placeholder={t(
                                    'reportPage.toolbar.selectProperty',
                                    'Select market',
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) =>
                                        setStartDate(event.target.value)
                                    }
                                    disabled={range !== 'custom'}
                                />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(event) =>
                                        setEndDate(event.target.value)
                                    }
                                    disabled={range !== 'custom'}
                                />
                            </div>
                            <Button
                                className="gap-2"
                                onClick={() => applyFilters()}
                            >
                                <Filter className="h-4 w-4" />
                                {t('reportPage.toolbar.generate', 'Generate')}
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                                {t('reportPage.toolbar.active', 'Active')}:{' '}
                                {activeReport.title}
                            </Badge>
                            <Badge variant="outline">
                                {t('reportPage.toolbar.range', 'Range')}:{' '}
                                {rangeLabel(filters.range, t)}
                            </Badge>
                            <Badge variant="outline">
                                {t('reportPage.toolbar.period', 'Period')}:{' '}
                                {period.label}
                            </Badge>
                            <Badge variant="outline">
                                {t('reportPage.toolbar.property', 'Market')}:{' '}
                                {activePropertyLabel}
                            </Badge>
                            <Badge
                                variant={
                                    hasPendingChanges ? 'secondary' : 'outline'
                                }
                            >
                                {hasPendingChanges
                                    ? t(
                                          'reportPage.toolbar.draft',
                                          'Draft changes not applied',
                                      )
                                    : t(
                                          'reportPage.toolbar.synced',
                                          'Current view synced',
                                      )}
                            </Badge>
                        </div>

                        {savedPresets.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-[#708689] uppercase">
                                    {t(
                                        'reportPage.toolbar.savedViews',
                                        'Saved views',
                                    )}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {savedPresets.map((preset) => (
                                        <div
                                            key={preset.id}
                                            className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 dark:bg-neutral-950"
                                        >
                                            <button
                                                type="button"
                                                className="px-2 py-1 text-sm"
                                                onClick={() =>
                                                    applySavedPreset(preset)
                                                }
                                            >
                                                {preset.name}
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                                                onClick={() =>
                                                    removeSavedPreset(preset.id)
                                                }
                                                aria-label={t(
                                                    'reportPage.toolbar.removePreset',
                                                    'Remove :name',
                                                ).replace(':name', preset.name)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
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
                                onClick={() => handleOverviewOpen(item.key)}
                                className={cn(
                                    'rounded-[1.6rem] border p-4 text-left shadow-sm shadow-slate-950/[0.02] transition-all hover:-translate-y-0.5 hover:border-brand-secondary/40 hover:bg-[#fbfdfc]',
                                    isRtl && 'text-right',
                                    filters.module === item.key
                                        ? 'border-brand-primary/25 bg-brand-primary/5'
                                        : 'border-[#dfe7e9] bg-white',
                                )}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="font-semibold text-brand-primary">
                                        {item.title}
                                    </h2>
                                    <Badge
                                        variant={statusVariant(
                                            catalogItem?.status ?? 'planned',
                                        )}
                                    >
                                        {(catalogItem?.status ?? 'planned') ===
                                        'live'
                                            ? t(
                                                  'reportPage.status.live',
                                                  'Live',
                                              )
                                            : t(
                                                  'reportPage.status.planned',
                                                  'Planned',
                                              )}
                                    </Badge>
                                </div>
                                <p className="mt-4 text-2xl font-semibold text-brand-primary">
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
                    <Card className="min-w-0 rounded-[1.75rem] border-[#dfe7e9] shadow-sm shadow-slate-950/[0.03] xl:col-span-8">
                        <CardHeader className="pb-3">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-xl text-brand-primary dark:text-white">
                                            {activeReport.title}
                                        </CardTitle>
                                        <Badge
                                            variant={statusVariant(
                                                activeReport.status,
                                            )}
                                        >
                                            {activeReport.status === 'live'
                                                ? t(
                                                      'reportPage.status.live',
                                                      'Live',
                                                  )
                                                : t(
                                                      'reportPage.status.planned',
                                                      'Planned',
                                                  )}
                                        </Badge>
                                    </div>
                                    <CardDescription className="max-w-2xl">
                                        {activeReport.description}
                                    </CardDescription>
                                </div>

                                {activeReport.isReady && canExportReports ? (
                                    <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                                        <Button
                                            variant="outline"
                                            className="gap-2 whitespace-nowrap"
                                            disabled={exportingFormat !== null}
                                            onClick={() =>
                                                downloadExport('pdf')
                                            }
                                        >
                                            {exportingFormat === 'pdf' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4" />
                                            )}
                                            {t(
                                                'reportPage.export.downloadPdf',
                                                'Download PDF',
                                            )}
                                        </Button>
                                        <Button
                                            className="gap-2 whitespace-nowrap"
                                            disabled={exportingFormat !== null}
                                            onClick={() =>
                                                downloadExport('xlsx')
                                            }
                                        >
                                            {exportingFormat === 'xlsx' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileSpreadsheet className="h-4 w-4" />
                                            )}
                                            {t(
                                                'reportPage.export.downloadExcel',
                                                'Download Excel',
                                            )}
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                    <CalendarRange className="h-4 w-4" />
                                    {t(
                                        'reportPage.table.reportingPeriod',
                                        'Reporting period',
                                    )}
                                    : {period.label}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium dark:bg-neutral-800">
                                    {t(
                                        'reportPage.table.visibleRows',
                                        ':count visible rows',
                                    ).replace(
                                        ':count',
                                        formatNumber(
                                            table.getFilteredRowModel().rows
                                                .length,
                                        ),
                                    )}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium dark:bg-neutral-800">
                                    {t(
                                        'reportPage.table.totalRows',
                                        ':count total rows',
                                    ).replace(
                                        ':count',
                                        formatNumber(
                                            activeReport.rows?.length ?? 0,
                                        ),
                                    )}
                                </span>
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
                                                    <p className="mt-2 text-2xl font-semibold text-brand-primary">
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
                                        <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex flex-1 items-center gap-2 rounded-full border bg-white px-3 dark:bg-neutral-950">
                                                <Search className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={search}
                                                    onChange={(event) =>
                                                        setSearch(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'reportPage.table.searchPlaceholder',
                                                        'Search within this report...',
                                                    )}
                                                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            className="gap-2"
                                                        >
                                                            <Columns3 className="h-4 w-4" />
                                                            {t(
                                                                'reportPage.table.columns',
                                                                'Columns',
                                                            )}
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-56"
                                                    >
                                                        <DropdownMenuLabel>
                                                            {t(
                                                                'reportPage.table.toggleColumns',
                                                                'Toggle columns',
                                                            )}
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {(
                                                            activeReport.columns ??
                                                            []
                                                        ).map(
                                                            (reportColumn) => {
                                                                const tableColumn =
                                                                    table.getColumn(
                                                                        reportColumn.key,
                                                                    );

                                                                if (
                                                                    !tableColumn
                                                                ) {
                                                                    return null;
                                                                }

                                                                return (
                                                                    <DropdownMenuCheckboxItem
                                                                        key={
                                                                            reportColumn.key
                                                                        }
                                                                        checked={tableColumn.getIsVisible()}
                                                                        onCheckedChange={(
                                                                            value,
                                                                        ) =>
                                                                            tableColumn.toggleVisibility(
                                                                                Boolean(
                                                                                    value,
                                                                                ),
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            reportColumn.label
                                                                        }
                                                                    </DropdownMenuCheckboxItem>
                                                                );
                                                            },
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <Button
                                                    variant="outline"
                                                    className="gap-2"
                                                    onClick={() => {
                                                        setSearch('');
                                                        setSorting([]);
                                                        setColumnVisibility({});
                                                    }}
                                                >
                                                    <SlidersHorizontal className="h-4 w-4" />
                                                    {t(
                                                        'reportPage.table.resetView',
                                                        'Reset view',
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="max-h-[38rem] overflow-auto">
                                            <Table className="min-w-[960px]">
                                                <TableHeader>
                                                    {table
                                                        .getHeaderGroups()
                                                        .map((headerGroup) => (
                                                            <TableRow
                                                                key={
                                                                    headerGroup.id
                                                                }
                                                            >
                                                                {headerGroup.headers.map(
                                                                    (
                                                                        header,
                                                                    ) => (
                                                                        <TableHead
                                                                            key={
                                                                                header.id
                                                                            }
                                                                            className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-neutral-950/95"
                                                                        >
                                                                            {header.isPlaceholder
                                                                                ? null
                                                                                : flexRender(
                                                                                      header
                                                                                          .column
                                                                                          .columnDef
                                                                                          .header,
                                                                                      header.getContext(),
                                                                                  )}
                                                                        </TableHead>
                                                                    ),
                                                                )}
                                                            </TableRow>
                                                        ))}
                                                </TableHeader>
                                                <TableBody>
                                                    {table.getRowModel().rows
                                                        .length > 0 ? (
                                                        table
                                                            .getRowModel()
                                                            .rows.map((row) => (
                                                                <TableRow
                                                                    key={row.id}
                                                                >
                                                                    {row
                                                                        .getVisibleCells()
                                                                        .map(
                                                                            (
                                                                                cell,
                                                                            ) => (
                                                                                <TableCell
                                                                                    key={
                                                                                        cell.id
                                                                                    }
                                                                                >
                                                                                    {flexRender(
                                                                                        cell
                                                                                            .column
                                                                                            .columnDef
                                                                                            .cell,
                                                                                        cell.getContext(),
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
                                                                    table.getAllLeafColumns()
                                                                        .length ||
                                                                    1
                                                                }
                                                                className="py-10 text-center text-muted-foreground"
                                                            >
                                                                {t(
                                                                    'reportPage.table.noRows',
                                                                    'No rows matched your search or filters.',
                                                                )}
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
                                        {t(
                                            'reportPage.table.planned',
                                            'This report type has been designed and reserved in the reporting architecture.',
                                        )}
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
                        {chartPanel ? (
                            <Card className="rounded-[1.75rem] border-[#dfe7e9] shadow-sm shadow-slate-950/[0.03]">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-[#20525a]" />
                                        <CardTitle className="text-base">
                                            {chartPanel.title}
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        {chartPanel.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer
                                        className="h-[260px] w-full"
                                        config={{
                                            value: {
                                                label: t(
                                                    'reportPage.chart.value',
                                                    'Value',
                                                ),
                                                color: '#123f46',
                                            },
                                        }}
                                    >
                                        {chartPanel.type === 'bar' ? (
                                            <BarChart data={chartPanel.data}>
                                                <CartesianGrid
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey={
                                                        chartPanel.labelKey
                                                    }
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval={0}
                                                    angle={-15}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent />
                                                    }
                                                />
                                                <Bar
                                                    dataKey={chartPanel.dataKey}
                                                    radius={[8, 8, 0, 0]}
                                                    fill="var(--color-value)"
                                                />
                                            </BarChart>
                                        ) : (
                                            <PieChart>
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            hideLabel
                                                        />
                                                    }
                                                />
                                                <Pie
                                                    data={chartPanel.data}
                                                    dataKey={chartPanel.dataKey}
                                                    nameKey={
                                                        chartPanel.labelKey
                                                    }
                                                    innerRadius={52}
                                                    outerRadius={86}
                                                    paddingAngle={3}
                                                >
                                                    {chartPanel.data.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`${chartPanel.title}-${String(entry[chartPanel.labelKey])}`}
                                                                fill={
                                                                    CHART_COLORS[
                                                                        index %
                                                                            CHART_COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                            </PieChart>
                                        )}
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        ) : null}

                        {activeReport.isReady
                            ? (activeReport.insights ?? []).map(
                                  (section, sectionIndex) => (
                                      <Card
                                          className="rounded-[1.75rem] border-[#dfe7e9] shadow-sm shadow-slate-950/[0.03]"
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
                                                      {t(
                                                          'reportPage.insights.empty',
                                                          'No insight rows matched this report window.',
                                                      )}
                                                  </div>
                                              )}
                                          </CardContent>
                                      </Card>
                                  ),
                              )
                            : null}

                        <Card className="rounded-[1.75rem] border-[#dfe7e9] shadow-sm shadow-slate-950/[0.03]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {t(
                                        'reportPage.export.notesTitle',
                                        'Export notes',
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'reportPage.export.notesDescription',
                                        'Delivery details for the current report output.',
                                    )}
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
