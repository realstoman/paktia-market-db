'use client';

import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
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
import AppLayout from '@/layouts/app-layout';
import { useAuthorization } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Branch, BreadcrumbItem } from '@/types';
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
    { value: 'year_to_date', label: 'Year to Date' },
    { value: 'custom', label: 'Custom' },
] as const;

const QUICK_PRESETS = RANGE_OPTIONS.filter(
    (option) => option.value !== 'custom',
);
const SAVED_PRESETS_KEY = 'baba-reports-saved-presets';
const CHART_COLORS = [
    '#14532d',
    '#15803d',
    '#3f6212',
    '#b45309',
    '#c2410c',
    '#1d4ed8',
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

interface SavedPreset {
    id: string;
    name: string;
    createdAt: string;
    filters: {
        range: string;
        startDate: string;
        endDate: string;
        branchId: string;
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

function rangeLabel(range: string) {
    return (
        RANGE_OPTIONS.find((option) => option.value === range)?.label ?? range
    );
}

function buildChartPanel(activeReport: ActiveReport): ChartPanel | null {
    const rows = activeReport.rows ?? [];

    if (!activeReport.isReady || rows.length === 0) {
        return null;
    }

    if (activeReport.key === 'orders') {
        const grouped = new Map<string, number>();

        for (const row of rows) {
            const key = String(row.status ?? 'Unknown');
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
        }

        return {
            title: 'Order mix',
            description: 'Distribution of orders by fulfillment state.',
            type: 'pie',
            data: Array.from(grouped.entries()).map(([name, value]) => ({
                name,
                value,
            })),
            dataKey: 'value',
            labelKey: 'name',
        };
    }

    if (activeReport.key === 'inventory') {
        return {
            title: 'Stock movement',
            description:
                'Highest absolute inventory movements in the selected window.',
            type: 'bar',
            data: rows
                .map((row) => ({
                    label: String(row.item ?? 'Unknown'),
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
            const key = String(row.source ?? 'Unknown');
            grouped.set(
                key,
                (grouped.get(key) ?? 0) + parseNumericValue(row.amount),
            );
        }

        return {
            title: 'Financial mix',
            description: 'Value concentration across financial entry sources.',
            type: 'bar',
            data: Array.from(grouped.entries()).map(([label, value]) => ({
                label,
                value,
            })),
            dataKey: 'value',
            labelKey: 'label',
        };
    }

    if (activeReport.key === 'products') {
        const grouped = new Map<string, number>();

        for (const row of rows) {
            const key = String(row.category ?? 'Uncategorized');
            grouped.set(
                key,
                (grouped.get(key) ?? 0) + parseNumericValue(row.salesTotal),
            );
        }

        return {
            title: 'Sales mix',
            description: 'Category contribution to product sales.',
            type: 'pie',
            data: Array.from(grouped.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6),
            dataKey: 'value',
            labelKey: 'name',
        };
    }

    if (activeReport.key === 'employees') {
        const grouped = new Map<string, number>();

        for (const row of rows) {
            const key = String(row.employmentType ?? 'Unassigned');
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
        }

        return {
            title: 'Staffing mix',
            description: 'Workforce distribution by employment type.',
            type: 'pie',
            data: Array.from(grouped.entries()).map(([name, value]) => ({
                name,
                value,
            })),
            dataKey: 'value',
            labelKey: 'name',
        };
    }

    if (activeReport.key === 'branches') {
        return {
            title: 'Branch revenue',
            description: 'Top branches by completed revenue.',
            type: 'bar',
            data: rows
                .map((row) => ({
                    label: String(row.branch ?? 'Unknown'),
                    value: parseNumericValue(row.revenue),
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
            title: 'Role mix',
            description: 'User distribution across assigned roles.',
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
    branches,
    filters,
    reportCatalog,
    overview,
    activeReport,
    period,
}: ReportsPageProps) {
    const { can } = useAuthorization();
    const [range, setRange] = useState(filters.range);
    const [startDate, setStartDate] = useState(filters.startDate);
    const [endDate, setEndDate] = useState(filters.endDate);
    const [branchId, setBranchId] = useState(
        filters.branchId?.toString() ?? '',
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

    const branchOptions = [
        { value: '', label: 'All Branches' },
        ...branches.map((branch) => ({
            value: String(branch.id),
            label: branch.name,
        })),
    ];

    useAutoSelectSingleOption(
        branches.map((branch) => ({
            value: String(branch.id),
            label: branch.name,
        })),
        branchId,
        setBranchId,
    );

    const moduleOptions = reportCatalog.map((item) => ({
        value: item.key,
        label: item.title,
    }));

    const activeBranchLabel =
        branchOptions.find(
            (option) => option.value === (filters.branchId?.toString() ?? ''),
        )?.label ?? 'All Branches';
    const hasPendingChanges =
        range !== filters.range ||
        startDate !== filters.startDate ||
        endDate !== filters.endDate ||
        branchId !== (filters.branchId?.toString() ?? '') ||
        module !== filters.module;

    const chartPanel = useMemo(
        () => buildChartPanel(activeReport),
        [activeReport],
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
        branchId?: string;
        module?: string;
    }) => {
        const nextFilters = {
            range: next?.range ?? range,
            startDate: next?.startDate ?? startDate,
            endDate: next?.endDate ?? endDate,
            branchId: next?.branchId ?? branchId,
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
        const defaultName = `${moduleOptions.find((option) => option.value === module)?.label ?? 'Report'} - ${rangeLabel(range)}`;
        const name = window.prompt('Preset name', defaultName)?.trim();

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
                branchId,
                module,
            },
        };

        setSavedPresets((current) => [preset, ...current].slice(0, 8));
        toast.success('Saved report preset.');
    };

    const applySavedPreset = (preset: SavedPreset) => {
        setRange(preset.filters.range);
        setStartDate(preset.filters.startDate);
        setEndDate(preset.filters.endDate);
        setBranchId(preset.filters.branchId);
        setModule(preset.filters.module);
        applyFilters(preset.filters);
        toast.success(`Loaded "${preset.name}".`);
    };

    const removeSavedPreset = (presetId: string) => {
        setSavedPresets((current) =>
            current.filter((item) => item.id !== presetId),
        );
        toast.success('Removed saved preset.');
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
                branchId,
                module,
            }),
        );

        const toastId = toast.loading(
            format === 'pdf'
                ? 'Generating PDF...'
                : 'Generating Excel export...',
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
                    ? 'PDF export is ready.'
                    : 'Excel export is ready.',
                { id: toastId },
            );
        } catch {
            toast.error('Export failed. Please try again.', { id: toastId });
        } finally {
            setExportingFormat(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="space-y-4 py-2">
                <section className="overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-[linear-gradient(135deg,#eff8f4_0%,#fff7e8_45%,#ffffff_100%)] p-5 dark:border-neutral-800 dark:bg-neutral-950 dark:bg-none">
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe2dc] bg-white/80 px-3 py-1 text-sm text-[#20464b]">
                                <Sparkles className="h-4 w-4" />
                                Reporting workspace
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-[#102f33] dark:text-white">
                                    Executive reports, without the admin clutter
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-[#47676b] dark:text-neutral-300">
                                    Build branch-aware reports quickly, compare
                                    operations visually, and export polished PDF
                                    or Excel outputs from the same workspace.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="success">
                                    7 live report families
                                </Badge>
                                <Badge variant="outline">True PDF export</Badge>
                                <Badge variant="outline">
                                    Native Excel .xlsx
                                </Badge>
                                <Badge variant="outline">Saved presets</Badge>
                            </div>
                        </div>

                        <Card className="border-white/80 bg-white/90 shadow-none dark:border-white/10 dark:bg-neutral-900">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Workspace status
                                </CardTitle>
                                <CardDescription>
                                    Modernized for faster analysis and repeat
                                    reporting.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
                                    <span>Analysis mode</span>
                                    <span className="font-medium text-foreground">
                                        Search, sort, toggle columns
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
                                    <span>Active report</span>
                                    <span className="font-medium text-foreground">
                                        {activeReport.title}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
                                    <span>Period</span>
                                    <span className="font-medium text-foreground">
                                        {period.label}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <Card className="border-neutral-200/70 shadow-none">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-lg">
                                    Reporting toolbar
                                </CardTitle>
                                <CardDescription>
                                    Choose a scope, use quick presets, then
                                    generate or save the view.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={saveCurrentPreset}
                                >
                                    <Save className="h-4 w-4" />
                                    Save view
                                </Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => applyFilters()}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Generate report
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
                                    {preset.label}
                                </Button>
                            ))}
                        </div>

                        <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr_0.8fr_auto]">
                            <SearchableDropdown
                                value={module}
                                options={moduleOptions}
                                onValueChange={setModule}
                                placeholder="Select report"
                            />
                            <SearchableDropdown
                                value={range}
                                options={RANGE_OPTIONS.map((option) => ({
                                    value: option.value,
                                    label: option.label,
                                }))}
                                onValueChange={setRange}
                                placeholder="Select range"
                            />
                            <SearchableDropdown
                                value={branchId}
                                options={branchOptions}
                                onValueChange={setBranchId}
                                placeholder="Select branch"
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
                                Generate
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                                Active: {activeReport.title}
                            </Badge>
                            <Badge variant="outline">
                                Range: {rangeLabel(filters.range)}
                            </Badge>
                            <Badge variant="outline">
                                Period: {period.label}
                            </Badge>
                            <Badge variant="outline">
                                Branch: {activeBranchLabel}
                            </Badge>
                            <Badge
                                variant={
                                    hasPendingChanges ? 'secondary' : 'outline'
                                }
                            >
                                {hasPendingChanges
                                    ? 'Draft changes not applied'
                                    : 'Current view synced'}
                            </Badge>
                        </div>

                        {savedPresets.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.18em] text-[#708689] uppercase">
                                    Saved views
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
                                                className="rounded-full p-1 text-muted-foreground transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                                                onClick={() =>
                                                    removeSavedPreset(preset.id)
                                                }
                                                aria-label={`Remove ${preset.name}`}
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
                                    'rounded-[1.6rem] border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#bdd3cb] hover:bg-[#fbfdfc]',
                                    filters.module === item.key
                                        ? 'border-[#8cb4a6] bg-[#f4fbf8]'
                                        : 'border-neutral-200 bg-white',
                                )}
                            >
                                <div className="flex items-center justify-between gap-3">
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
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-xl text-[#102f33] dark:text-white">
                                            {activeReport.title}
                                        </CardTitle>
                                        <Badge
                                            variant={statusVariant(
                                                activeReport.status,
                                            )}
                                        >
                                            {activeReport.status === 'live'
                                                ? 'Live'
                                                : 'Planned'}
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
                                            Download PDF
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
                                            Download Excel
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                    <CalendarRange className="h-4 w-4" />
                                    Reporting period: {period.label}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium dark:bg-neutral-800">
                                    {formatNumber(
                                        table.getFilteredRowModel().rows.length,
                                    )}{' '}
                                    visible rows
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium dark:bg-neutral-800">
                                    {formatNumber(
                                        activeReport.rows?.length ?? 0,
                                    )}{' '}
                                    total rows
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
                                                    placeholder="Search within this report..."
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
                                                            Columns
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-56"
                                                    >
                                                        <DropdownMenuLabel>
                                                            Toggle columns
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
                                                    Reset view
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
                                                                No rows matched
                                                                your search or
                                                                filters.
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
                        {chartPanel ? (
                            <Card className="shadow-none">
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
                                                label: 'Value',
                                                color: '#14532d',
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
                                    Delivery details for the current report
                                    output.
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
