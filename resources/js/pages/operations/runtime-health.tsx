'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { BreadcrumbItem } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Clock3,
    DatabaseZap,
    RefreshCw,
    ShieldCheck,
    Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unavailable';
type Translate = (key: string, fallback?: string) => string;

interface HealthComponent {
    status: HealthStatus;
    message: string;
    messageKey?: string;
}

interface RuntimeHealthPageProps {
    runtimeHealth: {
        status: HealthStatus;
        message: string;
        components: {
            projection?: HealthComponent & {
                latestProjectionAt?: string | null;
                stalePropertyCount: number;
                criticalPropertyCount: number;
                warningPropertyCount: number;
                properties: Array<{
                    propertyId: number;
                    propertyName: string;
                    status: string;
                    message: string;
                    latestProjectionAt?: string | null;
                }>;
            };
            queue: HealthComponent & {
                connection: string;
                driver: string;
                queue: string;
                pendingJobs?: number | null;
                failedJobs?: number | null;
                oldestPendingAt?: string | null;
                latestFailedAt?: string | null;
            };
            redis: HealthComponent & {
                cacheStore: string;
                posCacheStore: string;
                queueConnection: string;
                queueDriver: string;
                latencyMs?: number | null;
            };
            sync: HealthComponent & {
                activeCredentials: number;
                recentlyUsedCredentials: number;
                staleCredentials: number;
                revokedCredentials: number;
                expiredCredentials: number;
                latestUsedAt?: string | null;
                properties: Array<{
                    propertyId: number;
                    propertyName: string;
                    activeCredentialCount: number;
                    recentlyUsedCredentialCount: number;
                    latestUsedAt?: string | null;
                }>;
            };
            recentRefresh: HealthComponent & {
                lastSuccessfulAt?: string | null;
                ageMinutes?: number | null;
            };
        };
    };
}

function statusTone(status: HealthStatus) {
    if (status === 'healthy') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200';
    }
    if (status === 'warning') {
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200';
    }
    if (status === 'critical') {
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200';
    }
    return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-200';
}

function statusLabel(t: Translate, status: HealthStatus) {
    return t(
        `runtimeHealthPage.status.${status}`,
        status.charAt(0).toUpperCase() + status.slice(1),
    );
}

function componentMessage(
    t: Translate,
    component: string,
    value: HealthComponent,
) {
    const key = value.messageKey ?? `${component}.${value.status}`;
    return t(`runtimeHealthPage.messages.${key}`, value.message);
}

function formatTimestamp(
    value: string | null | undefined,
    locale: 'en' | 'fa' | 'ps',
    t: Translate,
) {
    if (!value) {
        return t('runtimeHealthPage.notRecorded');
    }

    const dateLocale =
        locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US';
    return new Intl.DateTimeFormat(dateLocale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-border/60 bg-[#f8f9fd] p-3 dark:bg-neutral-950">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
                {value}
            </p>
        </div>
    );
}

export default function RuntimeHealthPage({
    runtimeHealth,
}: RuntimeHealthPageProps) {
    const { locale, t } = useLocalization();
    const [isRunningChecks, setIsRunningChecks] = useState(false);
    const { components } = runtimeHealth;
    const projection = components.projection;
    const timestamp = (value?: string | null) =>
        formatTimestamp(value, locale, t);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard'), href: '/dashboard' },
        {
            title: t('runtimeHealthPage.title'),
            href: '/operations/runtime-health',
        },
    ];
    const runHealthChecks = () => {
        router.post(
            '/operations/runtime-health/run',
            {},
            {
                preserveScroll: true,
                onStart: () => setIsRunningChecks(true),
                onSuccess: () =>
                    toast.success(t('runtimeHealthPage.actions.runSuccess')),
                onError: () =>
                    toast.error(t('runtimeHealthPage.actions.runFailed')),
                onFinish: () => setIsRunningChecks(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('runtimeHealthPage.title')} />

            <div className="flex flex-col gap-6 p-2 sm:p-4">
                <section className="rounded-3xl border border-border/60 bg-white p-6 dark:bg-neutral-900">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-3xl space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[#edf1f4] px-3 py-1 text-xs font-medium text-muted-foreground">
                                <Activity className="size-3.5" />
                                {t('runtimeHealthPage.operationsRuntime')}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                {t('runtimeHealthPage.propertyRuntimeHealth')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    `runtimeHealthPage.messages.overall.${runtimeHealth.status}`,
                                    runtimeHealth.message,
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                type="button"
                                onClick={runHealthChecks}
                                disabled={isRunningChecks}
                                className="gap-2"
                            >
                                <RefreshCw
                                    className={`size-4 ${isRunningChecks ? 'animate-spin' : ''}`}
                                />
                                {isRunningChecks
                                    ? t('runtimeHealthPage.actions.running')
                                    : t('runtimeHealthPage.actions.runChecks')}
                            </Button>
                            <div
                                className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${statusTone(runtimeHealth.status)}`}
                            >
                                {statusLabel(t, runtimeHealth.status)}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    {projection ? (
                        <Card className="border-border/60">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DatabaseZap className="size-5" />
                                    {t('runtimeHealthPage.projection.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'runtimeHealthPage.projection.description',
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(projection.status)}`}
                                >
                                    {componentMessage(
                                        t,
                                        'projection',
                                        projection,
                                    )}
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Metric
                                        label={t(
                                            'runtimeHealthPage.projection.criticalProperties',
                                        )}
                                        value={formatNumber(
                                            projection.criticalPropertyCount,
                                        )}
                                    />
                                    <Metric
                                        label={t(
                                            'runtimeHealthPage.projection.warningProperties',
                                        )}
                                        value={formatNumber(
                                            projection.warningPropertyCount,
                                        )}
                                    />
                                    <Metric
                                        label={t(
                                            'runtimeHealthPage.projection.latestProjection',
                                        )}
                                        value={timestamp(
                                            projection.latestProjectionAt,
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    {projection.properties.length ? (
                                        projection.properties.map(
                                            (property) => (
                                                <div
                                                    key={property.propertyId}
                                                    className="rounded-2xl border border-border/60 p-3"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {
                                                                    property.propertyName
                                                                }
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    property.message
                                                                }
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(property.status as HealthStatus)}`}
                                                        >
                                                            {statusLabel(
                                                                t,
                                                                property.status as HealthStatus,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'runtimeHealthPage.projection.noIssues',
                                            )}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Workflow className="size-5" />
                                {t('runtimeHealthPage.queue.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('runtimeHealthPage.queue.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.queue.status)}`}
                            >
                                {componentMessage(t, 'queue', components.queue)}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.queue.connection',
                                    )}
                                    value={components.queue.connection}
                                />
                                <Metric
                                    label={t('runtimeHealthPage.queue.driver')}
                                    value={components.queue.driver}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.queue.pendingJobs',
                                    )}
                                    value={formatNumber(
                                        components.queue.pendingJobs ?? 0,
                                    )}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.queue.failedJobs',
                                    )}
                                    value={formatNumber(
                                        components.queue.failedJobs ?? 0,
                                    )}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.queue.oldestPending',
                                    )}
                                    value={timestamp(
                                        components.queue.oldestPendingAt,
                                    )}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.queue.latestFailure',
                                    )}
                                    value={timestamp(
                                        components.queue.latestFailedAt,
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="size-5" />
                                {t('runtimeHealthPage.refresh.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('runtimeHealthPage.refresh.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.recentRefresh.status)}`}
                            >
                                {componentMessage(
                                    t,
                                    'refresh',
                                    components.recentRefresh,
                                )}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.refresh.lastSuccessful',
                                    )}
                                    value={timestamp(
                                        components.recentRefresh
                                            .lastSuccessfulAt,
                                    )}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.refresh.ageMinutes',
                                    )}
                                    value={formatNumber(
                                        components.recentRefresh.ageMinutes ??
                                            0,
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="size-5" />
                                {t('runtimeHealthPage.sync.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('runtimeHealthPage.sync.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.sync.status)}`}
                            >
                                {componentMessage(t, 'sync', components.sync)}
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Metric
                                    label={t('runtimeHealthPage.sync.active')}
                                    value={formatNumber(
                                        components.sync.activeCredentials,
                                    )}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.sync.recentlyUsed',
                                    )}
                                    value={formatNumber(
                                        components.sync.recentlyUsedCredentials,
                                    )}
                                />
                                <Metric
                                    label={t('runtimeHealthPage.sync.stale')}
                                    value={formatNumber(
                                        components.sync.staleCredentials,
                                    )}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Metric
                                    label={t('runtimeHealthPage.sync.revoked')}
                                    value={formatNumber(
                                        components.sync.revokedCredentials,
                                    )}
                                />
                                <Metric
                                    label={t('runtimeHealthPage.sync.expired')}
                                    value={formatNumber(
                                        components.sync.expiredCredentials,
                                    )}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.sync.latestUsage',
                                    )}
                                    value={timestamp(
                                        components.sync.latestUsedAt,
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                {components.sync.properties.length ? (
                                    components.sync.properties.map(
                                        (property) => (
                                            <div
                                                key={property.propertyId}
                                                className="rounded-2xl border border-border/60 p-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {
                                                                property.propertyName
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t(
                                                                'runtimeHealthPage.sync.usageSummary',
                                                            )
                                                                .replace(
                                                                    ':recent',
                                                                    formatNumber(
                                                                        property.recentlyUsedCredentialCount,
                                                                    ),
                                                                )
                                                                .replace(
                                                                    ':active',
                                                                    formatNumber(
                                                                        property.activeCredentialCount,
                                                                    ),
                                                                )}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {timestamp(
                                                            property.latestUsedAt,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'runtimeHealthPage.sync.noCredentials',
                                        )}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock3 className="size-5" />
                                {t('runtimeHealthPage.notes.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>{t('runtimeHealthPage.notes.projection')}</p>
                            <p>{t('runtimeHealthPage.notes.queue')}</p>
                            <p>{t('runtimeHealthPage.notes.redis')}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-5" />
                                {t('runtimeHealthPage.redis.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('runtimeHealthPage.redis.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.redis.status)}`}
                            >
                                {componentMessage(t, 'redis', components.redis)}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.redis.cacheStore',
                                    )}
                                    value={components.redis.cacheStore}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.redis.posCacheStore',
                                    )}
                                    value={components.redis.posCacheStore}
                                />
                                <Metric
                                    label={t(
                                        'runtimeHealthPage.redis.queueConnection',
                                    )}
                                    value={components.redis.queueConnection}
                                />
                                <Metric
                                    label={t('runtimeHealthPage.redis.latency')}
                                    value={formatNumber(
                                        components.redis.latencyMs ?? 0,
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
