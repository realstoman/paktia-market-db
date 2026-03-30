'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import {
    Activity,
    Clock3,
    DatabaseZap,
    RefreshCw,
    ShieldCheck,
    Workflow,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Runtime Health',
        href: '/operations/runtime-health',
    },
];

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unavailable';

interface RuntimeHealthPageProps {
    runtimeHealth: {
        status: HealthStatus;
        message: string;
        components: {
            projection: {
                status: HealthStatus;
                message: string;
                latestProjectionAt?: string | null;
                staleBranchCount: number;
                criticalBranchCount: number;
                warningBranchCount: number;
                branches: Array<{
                    branchId: number;
                    branchName: string;
                    status: string;
                    message: string;
                    latestProjectionAt?: string | null;
                }>;
            };
            queue: {
                status: HealthStatus;
                message: string;
                connection: string;
                driver: string;
                queue: string;
                pendingJobs?: number | null;
                failedJobs?: number | null;
                oldestPendingAt?: string | null;
                latestFailedAt?: string | null;
            };
            redis: {
                status: HealthStatus;
                message: string;
                cacheStore: string;
                posCacheStore: string;
                queueConnection: string;
                queueDriver: string;
                latencyMs?: number | null;
            };
            sync: {
                status: HealthStatus;
                message: string;
                activeCredentials: number;
                recentlyUsedCredentials: number;
                staleCredentials: number;
                revokedCredentials: number;
                expiredCredentials: number;
                latestUsedAt?: string | null;
                branches: Array<{
                    branchId: number;
                    branchName: string;
                    activeCredentialCount: number;
                    recentlyUsedCredentialCount: number;
                    latestUsedAt?: string | null;
                }>;
            };
            recentRefresh: {
                status: HealthStatus;
                message: string;
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

function statusLabel(status: HealthStatus) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatTimestamp(value?: string | null) {
    if (!value) {
        return 'Not recorded';
    }

    return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function Metric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-background/80 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
        </div>
    );
}

export default function RuntimeHealthPage({
    runtimeHealth,
}: RuntimeHealthPageProps) {
    const { components } = runtimeHealth;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Runtime Health" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-6 shadow-sm dark:from-brand-bg-dark dark:via-brand-bg-dark dark:to-emerald-950/20">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-3xl space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                <Activity className="h-3.5 w-3.5" />
                                Operations Runtime
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                Branch runtime health
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {runtimeHealth.message}
                            </p>
                        </div>
                        <div
                            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${statusTone(runtimeHealth.status)}`}
                        >
                            {statusLabel(runtimeHealth.status)}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DatabaseZap className="h-5 w-5" />
                                Projection Health
                            </CardTitle>
                            <CardDescription>
                                Branch-day summary freshness and lag against recent activity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.projection.status)}`}>
                                {components.projection.message}
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Metric
                                    label="Critical Branches"
                                    value={formatNumber(components.projection.criticalBranchCount)}
                                />
                                <Metric
                                    label="Warning Branches"
                                    value={formatNumber(components.projection.warningBranchCount)}
                                />
                                <Metric
                                    label="Latest Projection"
                                    value={formatTimestamp(components.projection.latestProjectionAt)}
                                />
                            </div>
                            <div className="space-y-2">
                                {components.projection.branches.length > 0 ? (
                                    components.projection.branches.map((branch) => (
                                        <div
                                            key={branch.branchId}
                                            className="rounded-2xl border border-border/60 p-3"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {branch.branchName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {branch.message}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(branch.status as HealthStatus)}`}
                                                >
                                                    {statusLabel(branch.status as HealthStatus)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No branch-level projection issues are currently surfaced.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Workflow className="h-5 w-5" />
                                Queue Health
                            </CardTitle>
                            <CardDescription>
                                Queue connection, backlog pressure, and failed-job signal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.queue.status)}`}>
                                {components.queue.message}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric label="Connection" value={components.queue.connection} />
                                <Metric label="Driver" value={components.queue.driver} />
                                <Metric
                                    label="Pending Jobs"
                                    value={formatNumber(components.queue.pendingJobs ?? 0)}
                                />
                                <Metric
                                    label="Failed Jobs"
                                    value={formatNumber(components.queue.failedJobs ?? 0)}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric
                                    label="Oldest Pending"
                                    value={formatTimestamp(components.queue.oldestPendingAt)}
                                />
                                <Metric
                                    label="Latest Failure"
                                    value={formatTimestamp(components.queue.latestFailedAt)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                Recent Refresh
                            </CardTitle>
                            <CardDescription>
                                Heartbeat for the scheduled recent-window projection rebuild.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.recentRefresh.status)}`}>
                                {components.recentRefresh.message}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric
                                    label="Last Successful Refresh"
                                    value={formatTimestamp(components.recentRefresh.lastSuccessfulAt)}
                                />
                                <Metric
                                    label="Age (Minutes)"
                                    value={formatNumber(components.recentRefresh.ageMinutes ?? 0)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                Branch Sync Activity
                            </CardTitle>
                            <CardDescription>
                                Active branch-local sync credentials and recent usage footprint.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.sync.status)}`}>
                                {components.sync.message}
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Metric
                                    label="Active"
                                    value={formatNumber(components.sync.activeCredentials)}
                                />
                                <Metric
                                    label="Recently Used"
                                    value={formatNumber(components.sync.recentlyUsedCredentials)}
                                />
                                <Metric
                                    label="Stale"
                                    value={formatNumber(components.sync.staleCredentials)}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Metric
                                    label="Revoked"
                                    value={formatNumber(components.sync.revokedCredentials)}
                                />
                                <Metric
                                    label="Expired"
                                    value={formatNumber(components.sync.expiredCredentials)}
                                />
                                <Metric
                                    label="Latest Usage"
                                    value={formatTimestamp(components.sync.latestUsedAt)}
                                />
                            </div>
                            <div className="space-y-2">
                                {components.sync.branches.length > 0 ? (
                                    components.sync.branches.map((branch) => (
                                        <div
                                            key={branch.branchId}
                                            className="rounded-2xl border border-border/60 p-3"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {branch.branchName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatNumber(branch.recentlyUsedCredentialCount)} recently used of{' '}
                                                        {formatNumber(branch.activeCredentialCount)} active credentials
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimestamp(branch.latestUsedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No branch sync credentials are active yet.
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
                                <Clock3 className="h-5 w-5" />
                                Runtime Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                Projection health tells us whether summary widgets are safe to trust for current branch activity.
                            </p>
                            <p>
                                Queue health is the best early signal that projection jobs, sync tasks, and future branch-local replication can fall behind.
                            </p>
                            <p>
                                Redis availability matters because the local-first rollout depends on fast cache and queue services to stay resilient during network instability.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Redis Runtime
                            </CardTitle>
                            <CardDescription>
                                Cache and queue readiness for branch-local deployment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(components.redis.status)}`}>
                                {components.redis.message}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Metric label="Cache Store" value={components.redis.cacheStore} />
                                <Metric
                                    label="POS Cache Store"
                                    value={components.redis.posCacheStore}
                                />
                                <Metric
                                    label="Queue Connection"
                                    value={components.redis.queueConnection}
                                />
                                <Metric
                                    label="Latency (ms)"
                                    value={formatNumber(components.redis.latencyMs ?? 0)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
