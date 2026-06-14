'use client';

import { ActivityLogDiff } from '@/components/activity-log-diff';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ActivityLogEntry {
    id: number;
    action: string;
    auditable_type: string | null;
    auditable_type_short: string | null;
    auditable_id: number | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    url: string | null;
    method: string | null;
    batch_uuid: string | null;
    branch_id: number | null;
    meta: Record<string, unknown> | null;
    created_at: string | null;
    user?: { id: number; name: string; email: string } | null;
    branch?: { id: number; name: string } | null;
}

interface Archive {
    id: number;
    period: string;
    records_count: number;
    size_bytes: number;
    created_at: string | null;
}

interface ReferenceData {
    actions: string[];
    auditableTypes: { value: string; label: string }[];
    users: { id: number; name: string; email: string }[];
    branches: { id: number; name: string }[];
}

interface Filters {
    filter?: {
        user_id?: string;
        action?: string;
        auditable_type?: string;
        branch_id?: string;
        from?: string;
        to?: string;
        q?: string;
    };
    sort?: string;
    per_page?: string | number;
}

interface ActivityLogsPageProps {
    logs: {
        data: ActivityLogEntry[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    archives: Archive[];
    filters: Filters;
    referenceData: ReferenceData;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Activity Logs', href: '/admin/activity-logs' },
];

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const kilo = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(
        Math.floor(Math.log(bytes) / Math.log(kilo)),
        sizes.length - 1,
    );
    return `${(bytes / Math.pow(kilo, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDateTime(value?: string | null): string {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

const actionBadgeVariant: Record<string, string> = {
    created:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    updated:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    deleted: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    restored: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
};

function ActionBadge({ action }: { action: string }) {
    const cls = actionBadgeVariant[action] ?? 'bg-muted text-muted-foreground';

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
        >
            {action}
        </span>
    );
}

export default function ActivityLogsIndexPage({
    logs,
    archives,
    filters,
    referenceData,
}: ActivityLogsPageProps) {
    const initial = filters.filter ?? {};
    const [state, setState] = useState({
        q: initial.q ?? '',
        action: initial.action ?? '',
        auditable_type: initial.auditable_type ?? '',
        user_id: initial.user_id ?? '',
        branch_id: initial.branch_id ?? '',
        from: initial.from ?? '',
        to: initial.to ?? '',
    });
    const [selected, setSelected] = useState<ActivityLogEntry | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didMount = useRef(false);

    const perPage = logs.meta.per_page;
    const startIndex =
        logs.meta.total === 0 ? 0 : (logs.meta.current_page - 1) * perPage + 1;
    const endIndex = Math.min(
        logs.meta.current_page * perPage,
        logs.meta.total,
    );

    const paginationLabel = useMemo(() => {
        if (logs.meta.total === 0) {
            return 'No records';
        }

        return `Showing ${startIndex.toLocaleString()}\u2013${endIndex.toLocaleString()} of ${logs.meta.total.toLocaleString()} records · page ${logs.meta.current_page} of ${logs.meta.last_page}`;
    }, [logs.meta, startIndex, endIndex]);

    function buildPayload(
        overrides: Record<string, string | number> = {},
    ): Record<string, string | number> {
        const payload: Record<string, string | number> = { ...overrides };
        Object.entries(state).forEach(([key, value]) => {
            if (value !== '') {
                payload[`filter[${key}]`] = value;
            }
        });

        return payload;
    }

    function applyFilters() {
        router.get('/admin/activity-logs', buildPayload(), {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function resetFilters() {
        setState({
            q: '',
            action: '',
            auditable_type: '',
            user_id: '',
            branch_id: '',
            from: '',
            to: '',
        });
        router.get('/admin/activity-logs', {}, { preserveState: false });
    }

    function goToPage(page: number) {
        router.get('/admin/activity-logs', buildPayload({ page }), {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleRefresh() {
        if (isRefreshing) return;

        setIsRefreshing(true);
        const minSpinAt = Date.now() + 2000;

        router.reload({
            onFinish: () => {
                const remaining = Math.max(0, minSpinAt - Date.now());
                setTimeout(() => setIsRefreshing(false), remaining);
            },
        });
    }

    // Debounced server-side search: fire a request 400ms after the user stops
    // typing in the search box. Skip on initial mount so we don't replay the
    // inbound query string as a new request.
    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;

            return;
        }

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => {
            router.get('/admin/activity-logs', buildPayload(), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.q]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />

            <div className="space-y-4">
                <div className="rounded-lg bg-white p-6 dark:bg-brand-bg-dark">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Activity Logs
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Retained for 30 days. Older data is available in
                                the monthly archives below.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCcw
                                className={cn(
                                    'me-2 size-4 transition-transform',
                                    isRefreshing && 'animate-spin',
                                )}
                            />
                            Refresh
                        </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <div className="space-y-1">
                            <Label htmlFor="al-q">Search</Label>
                            <Input
                                id="al-q"
                                value={state.q}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        q: e.target.value,
                                    }))
                                }
                                placeholder="Search action, URL, values…"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Action</Label>
                            <SearchableDropdown
                                value={state.action}
                                options={[
                                    { value: '', label: 'All actions' },
                                    ...referenceData.actions.map((action) => ({
                                        value: action,
                                        label: action,
                                    })),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({ ...s, action: value }))
                                }
                                placeholder="All actions"
                                searchPlaceholder="Search actions…"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Entity</Label>
                            <SearchableDropdown
                                value={state.auditable_type}
                                options={[
                                    { value: '', label: 'All entities' },
                                    ...referenceData.auditableTypes.map(
                                        (type) => ({
                                            value: type.value,
                                            label: type.label,
                                        }),
                                    ),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({
                                        ...s,
                                        auditable_type: value,
                                    }))
                                }
                                placeholder="All entities"
                                searchPlaceholder="Search entities…"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>User</Label>
                            <SearchableDropdown
                                value={state.user_id}
                                options={[
                                    { value: '', label: 'All users' },
                                    ...referenceData.users.map((user) => ({
                                        value: user.id.toString(),
                                        label: `${user.name} (${user.email})`,
                                    })),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({ ...s, user_id: value }))
                                }
                                placeholder="All users"
                                searchPlaceholder="Search by name or email…"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Branch</Label>
                            <SearchableDropdown
                                value={state.branch_id}
                                options={[
                                    { value: '', label: 'All branches' },
                                    ...referenceData.branches.map((branch) => ({
                                        value: branch.id.toString(),
                                        label: branch.name,
                                    })),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({
                                        ...s,
                                        branch_id: value,
                                    }))
                                }
                                placeholder="All branches"
                                searchPlaceholder="Search branches…"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="al-from">From</Label>
                            <Input
                                id="al-from"
                                type="date"
                                value={state.from}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        from: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="al-to">To</Label>
                            <Input
                                id="al-to"
                                type="date"
                                value={state.to}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        to: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={resetFilters}>
                            Reset
                        </Button>
                        <Button variant={'outline'} onClick={applyFilters}>
                            Apply filters
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 dark:bg-brand-bg-dark">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {paginationLabel}
                        </span>
                    </div>
                    <div className="overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-3 py-2 text-left">
                                        When
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        User
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Action
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Entity
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Branch
                                    </th>
                                    <th className="px-3 py-2 text-left">IP</th>
                                    <th className="px-3 py-2 text-right">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-3 py-8 text-center text-muted-foreground"
                                        >
                                            No activity found with these
                                            filters.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-t border-border hover:bg-muted/30"
                                        >
                                            <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td className="px-3 py-2">
                                                {log.user ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {log.user.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {log.user.email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        system
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <ActionBadge
                                                    action={log.action}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                {log.auditable_type_short ? (
                                                    <div>
                                                        <span className="font-medium">
                                                            {
                                                                log.auditable_type_short
                                                            }
                                                        </span>
                                                        {log.auditable_id ? (
                                                            <span className="ms-1 text-xs text-muted-foreground">
                                                                #
                                                                {
                                                                    log.auditable_id
                                                                }
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {log.branch?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {log.ip_address ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelected(log)
                                                    }
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {logs.meta.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                                {paginationLabel}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={logs.meta.current_page <= 1}
                                    onClick={() =>
                                        goToPage(logs.meta.current_page - 1)
                                    }
                                >
                                    <ChevronLeft className="me-1 size-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        logs.meta.current_page >=
                                        logs.meta.last_page
                                    }
                                    onClick={() =>
                                        goToPage(logs.meta.current_page + 1)
                                    }
                                >
                                    Next
                                    <ChevronRight className="ms-1 size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-lg bg-white p-6 dark:bg-brand-bg-dark">
                    <div className="mb-3">
                        <h3 className="text-base font-semibold">
                            Archived periods
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Download archived logs for record-keeping. Each
                            archive is a gzipped JSON-lines file keyed by month.
                        </p>
                    </div>

                    {archives.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No archives yet. Archives are generated daily at
                            03:00 AM.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-3 py-2 text-left">
                                            Period
                                        </th>
                                        <th className="px-3 py-2 text-right">
                                            Records
                                        </th>
                                        <th className="px-3 py-2 text-right">
                                            Size
                                        </th>
                                        <th className="px-3 py-2 text-left">
                                            Created
                                        </th>
                                        <th className="px-3 py-2 text-right">
                                            Download
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {archives.map((archive) => (
                                        <tr
                                            key={archive.id}
                                            className="border-t border-border"
                                        >
                                            <td className="px-3 py-2 font-mono">
                                                {archive.period}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {archive.records_count.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {formatBytes(
                                                    archive.size_bytes,
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {formatDateTime(
                                                    archive.created_at,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <a
                                                    href={`/admin/activity-logs/archives/${archive.id}/download`}
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    <Download className="size-4" />
                                                    Download
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Drawer
                open={selected !== null}
                onOpenChange={() => setSelected(null)}
            >
                <DrawerContent className="max-h-[85vh] overflow-auto">
                    {selected && (
                        <>
                            <DrawerHeader>
                                <DrawerTitle className="flex items-center gap-2">
                                    <ActionBadge action={selected.action} />
                                    <span>
                                        {selected.auditable_type_short ??
                                            'System'}
                                        {selected.auditable_id
                                            ? ` #${selected.auditable_id}`
                                            : ''}
                                    </span>
                                </DrawerTitle>
                                <DrawerDescription>
                                    {formatDateTime(selected.created_at)} ·{' '}
                                    {selected.user?.name ?? 'system'}
                                    {selected.url
                                        ? ` · ${selected.method} ${selected.url}`
                                        : ''}
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="space-y-4 p-4">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <Badge variant="secondary">
                                        IP: {selected.ip_address ?? '—'}
                                    </Badge>
                                    <Badge variant="secondary">
                                        Batch:{' '}
                                        {selected.batch_uuid?.slice(0, 8) ??
                                            '—'}
                                    </Badge>
                                    <Badge variant="secondary">
                                        Branch: {selected.branch?.name ?? '—'}
                                    </Badge>
                                </div>

                                <ActivityLogDiff
                                    oldValues={selected.old_values}
                                    newValues={selected.new_values}
                                />

                                {selected.meta &&
                                    Object.keys(selected.meta).length > 0 && (
                                        <div>
                                            <h4 className="mb-1 text-sm font-semibold">
                                                Additional context
                                            </h4>
                                            <pre className="overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs">
                                                {JSON.stringify(
                                                    selected.meta,
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </div>
                                    )}
                            </div>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </AppLayout>
    );
}
