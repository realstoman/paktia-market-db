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
import { useLocalization } from '@/lib/localization';
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
    property_id: number | null;
    meta: Record<string, unknown> | null;
    created_at: string | null;
    user?: { id: number; name: string; email: string } | null;
    property?: { id: number; name: string } | null;
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
    properties: { id: number; name: string }[];
}

interface Filters {
    filter?: {
        user_id?: string;
        action?: string;
        auditable_type?: string;
        property_id?: string;
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

function formatDateTime(
    value: string | null | undefined,
    locale: string,
): string {
    if (!value) return '—';
    try {
        const dateLocale =
            locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US';

        return new Date(value).toLocaleString(dateLocale);
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

const actionTranslationKeys: Record<string, string> = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
    restored: 'restored',
    'auth.login': 'login',
    'auth.logout': 'logout',
    'auth.login_failed': 'loginFailed',
    'auth.lockout': 'lockout',
    'auth.password_reset': 'passwordReset',
    'auth.registered': 'registered',
    'auth.email_verified': 'emailVerified',
    'auth.2fa.enabled': 'twoFactorEnabled',
    'auth.2fa.confirmed': 'twoFactorConfirmed',
    'auth.2fa.disabled': 'twoFactorDisabled',
    'auth.2fa.failed': 'twoFactorFailed',
    'auth.2fa.recovery_codes_generated': 'recoveryCodesGenerated',
};

function ActionBadge({ action, label }: { action: string; label: string }) {
    const cls = actionBadgeVariant[action] ?? 'bg-muted text-muted-foreground';

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
        >
            {label}
        </span>
    );
}

export default function ActivityLogsIndexPage({
    logs,
    archives,
    filters,
    referenceData,
}: ActivityLogsPageProps) {
    const { isRtl, locale, t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard', 'Dashboard'),
            href: dashboard().url,
        },
        {
            title: t('activityLogsPage.title', 'Activity Logs'),
            href: '/admin/activity-logs',
        },
    ];
    const actionLabel = (action: string) => {
        const key = actionTranslationKeys[action];

        return key
            ? t('activityLogsPage.actions.' + key, action)
            : action.replaceAll('_', ' ');
    };
    const entityLabel = (entity?: string | null) =>
        entity
            ? t('activityLogsPage.entities.' + entity, entity)
            : t('activityLogsPage.table.system', 'System');
    const initial = filters.filter ?? {};
    const [state, setState] = useState({
        q: initial.q ?? '',
        action: initial.action ?? '',
        auditable_type: initial.auditable_type ?? '',
        user_id: initial.user_id ?? '',
        property_id: initial.property_id ?? '',
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
            return t('activityLogsPage.noRecords', 'No records');
        }

        return t(
            'activityLogsPage.pagination',
            'Showing :start–:end of :total records · page :page of :pages',
        )
            .replace(':start', startIndex.toLocaleString())
            .replace(':end', endIndex.toLocaleString())
            .replace(':total', logs.meta.total.toLocaleString())
            .replace(':page', logs.meta.current_page.toLocaleString())
            .replace(':pages', logs.meta.last_page.toLocaleString());
    }, [logs.meta, startIndex, endIndex, t]);

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
            property_id: '',
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
            <Head title={t('activityLogsPage.title')} />

            <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-4 text-start">
                <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-6">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-semibold">
                                {t('activityLogsPage.title')}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t('activityLogsPage.subtitle')}
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
                            {t('activityLogsPage.refresh')}
                        </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <div className="space-y-1">
                            <Label htmlFor="al-q">
                                {t('activityLogsPage.search')}
                            </Label>
                            <Input
                                id="al-q"
                                value={state.q}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        q: e.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'activityLogsPage.searchPlaceholder',
                                )}
                                className="bg-white dark:bg-neutral-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('activityLogsPage.action')}</Label>
                            <SearchableDropdown
                                value={state.action}
                                options={[
                                    {
                                        value: '',
                                        label: t('activityLogsPage.allActions'),
                                    },
                                    ...referenceData.actions.map((action) => ({
                                        value: action,
                                        label: actionLabel(action),
                                    })),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({ ...s, action: value }))
                                }
                                placeholder={t('activityLogsPage.allActions')}
                                searchPlaceholder={t(
                                    'activityLogsPage.searchActions',
                                )}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('activityLogsPage.entity')}</Label>
                            <SearchableDropdown
                                value={state.auditable_type}
                                options={[
                                    {
                                        value: '',
                                        label: t(
                                            'activityLogsPage.allEntities',
                                        ),
                                    },
                                    ...referenceData.auditableTypes.map(
                                        (type) => ({
                                            value: type.value,
                                            label: entityLabel(type.label),
                                        }),
                                    ),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({
                                        ...s,
                                        auditable_type: value,
                                    }))
                                }
                                placeholder={t('activityLogsPage.allEntities')}
                                searchPlaceholder={t(
                                    'activityLogsPage.searchEntities',
                                )}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('activityLogsPage.user')}</Label>
                            <SearchableDropdown
                                value={state.user_id}
                                options={[
                                    {
                                        value: '',
                                        label: t('activityLogsPage.allUsers'),
                                    },
                                    ...referenceData.users.map((user) => ({
                                        value: user.id.toString(),
                                        label: `${user.name} (${user.email})`,
                                    })),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({ ...s, user_id: value }))
                                }
                                placeholder={t('activityLogsPage.allUsers')}
                                searchPlaceholder={t(
                                    'activityLogsPage.searchUsers',
                                )}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('activityLogsPage.property')}</Label>
                            <SearchableDropdown
                                value={state.property_id}
                                options={[
                                    {
                                        value: '',
                                        label: t(
                                            'activityLogsPage.allProperties',
                                        ),
                                    },
                                    ...referenceData.properties.map(
                                        (property) => ({
                                            value: property.id.toString(),
                                            label: property.name,
                                        }),
                                    ),
                                ]}
                                onValueChange={(value) =>
                                    setState((s) => ({
                                        ...s,
                                        property_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'activityLogsPage.allProperties',
                                )}
                                searchPlaceholder={t(
                                    'activityLogsPage.searchProperties',
                                )}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="al-from">
                                {t('activityLogsPage.from')}
                            </Label>
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
                            <Label htmlFor="al-to">
                                {t('activityLogsPage.to')}
                            </Label>
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

                    <div className="mt-4 flex items-center justify-start gap-2">
                        <Button variant="outline" onClick={resetFilters}>
                            {t('activityLogsPage.reset')}
                        </Button>
                        <Button variant={'outline'} onClick={applyFilters}>
                            {t('activityLogsPage.applyFilters')}
                        </Button>
                    </div>
                </div>

                <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-6">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {paginationLabel}
                        </span>
                    </div>
                    <div className="overflow-x-auto rounded-md border border-border">
                        <table
                            dir={isRtl ? 'rtl' : 'ltr'}
                            className="w-full text-sm"
                        >
                            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-3 py-2 text-start">
                                        {t('activityLogsPage.table.when')}
                                    </th>
                                    <th className="px-3 py-2 text-start">
                                        {t('activityLogsPage.table.user')}
                                    </th>
                                    <th className="px-3 py-2 text-start">
                                        {t('activityLogsPage.table.action')}
                                    </th>
                                    <th className="px-3 py-2 text-start">
                                        {t('activityLogsPage.table.entity')}
                                    </th>
                                    <th className="px-3 py-2 text-start">
                                        {t('activityLogsPage.table.property')}
                                    </th>
                                    <th className="px-3 py-2 text-start">
                                        {t('activityLogsPage.table.ip')}
                                    </th>
                                    <th className="px-3 py-2 text-end">
                                        {t('activityLogsPage.table.details')}
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
                                            {t('activityLogsPage.table.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-t border-border hover:bg-muted/30"
                                        >
                                            <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                                                {formatDateTime(
                                                    log.created_at,
                                                    locale,
                                                )}
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
                                                        {t(
                                                            'activityLogsPage.table.system',
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <ActionBadge
                                                    action={log.action}
                                                    label={actionLabel(
                                                        log.action,
                                                    )}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                {log.auditable_type_short ? (
                                                    <div>
                                                        <span className="font-medium">
                                                            {entityLabel(
                                                                log.auditable_type_short,
                                                            )}
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
                                                {log.property?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {log.ip_address ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelected(log)
                                                    }
                                                >
                                                    {t(
                                                        'activityLogsPage.table.view',
                                                    )}
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
                                    <ChevronLeft
                                        className={cn(
                                            'me-1 size-4',
                                            isRtl && 'rotate-180',
                                        )}
                                    />
                                    {t('common.previousPage', 'Previous')}
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
                                    {t('common.nextPage', 'Next')}
                                    <ChevronRight
                                        className={cn(
                                            'ms-1 size-4',
                                            isRtl && 'rotate-180',
                                        )}
                                    />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-6">
                    <div className="mb-3">
                        <h3 className="text-base font-semibold">
                            {t('activityLogsPage.archives.title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('activityLogsPage.archives.subtitle')}
                        </p>
                    </div>

                    {archives.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t('activityLogsPage.archives.empty')}
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-border">
                            <table
                                dir={isRtl ? 'rtl' : 'ltr'}
                                className="w-full text-sm"
                            >
                                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-3 py-2 text-start">
                                            {t(
                                                'activityLogsPage.archives.period',
                                            )}
                                        </th>
                                        <th className="px-3 py-2 text-end">
                                            {t(
                                                'activityLogsPage.archives.records',
                                            )}
                                        </th>
                                        <th className="px-3 py-2 text-end">
                                            {t(
                                                'activityLogsPage.archives.size',
                                            )}
                                        </th>
                                        <th className="px-3 py-2 text-start">
                                            {t(
                                                'activityLogsPage.archives.created',
                                            )}
                                        </th>
                                        <th className="px-3 py-2 text-end">
                                            {t(
                                                'activityLogsPage.archives.download',
                                            )}
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
                                            <td className="px-3 py-2 text-end">
                                                {archive.records_count.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2 text-end">
                                                {formatBytes(
                                                    archive.size_bytes,
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {formatDateTime(
                                                    archive.created_at,
                                                    locale,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-end">
                                                <a
                                                    href={`/admin/activity-logs/archives/${archive.id}/download`}
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    <Download className="size-4" />
                                                    {t(
                                                        'activityLogsPage.archives.download',
                                                    )}
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
                <DrawerContent
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className="max-h-[85vh] overflow-auto text-start"
                >
                    {selected && (
                        <>
                            <DrawerHeader className="text-start">
                                <DrawerTitle className="flex items-center gap-2">
                                    <ActionBadge
                                        action={selected.action}
                                        label={actionLabel(selected.action)}
                                    />
                                    <span>
                                        {entityLabel(
                                            selected.auditable_type_short,
                                        )}
                                        {selected.auditable_id
                                            ? ` #${selected.auditable_id}`
                                            : ''}
                                    </span>
                                </DrawerTitle>
                                <DrawerDescription>
                                    {formatDateTime(
                                        selected.created_at,
                                        locale,
                                    )}{' '}
                                    ·{' '}
                                    {selected.user?.name ??
                                        t('activityLogsPage.table.system')}
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
                                        {t('activityLogsPage.drawer.batch')}:{' '}
                                        {selected.batch_uuid?.slice(0, 8) ??
                                            '—'}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {t('activityLogsPage.drawer.property')}:{' '}
                                        {selected.property?.name ?? '—'}
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
                                                {t(
                                                    'activityLogsPage.drawer.additionalContext',
                                                )}
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
