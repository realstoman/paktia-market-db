'use client';

import { ActivityLogDiff } from '@/components/activity-log-diff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface ActivityLogEntry {
    id: number;
    action: string;
    auditable_type: string | null;
    auditable_type_short: string | null;
    auditable_id: number | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    url: string | null;
    method: string | null;
    batch_uuid: string | null;
    meta: Record<string, unknown> | null;
    created_at: string | null;
    user?: { id: number; name: string; email: string } | null;
    property?: { id: number; name: string } | null;
}

interface ShowPageProps {
    log: ActivityLogEntry;
}

export default function ActivityLogShowPage({ log }: ShowPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Activity Logs', href: '/admin/activity-logs' },
        { title: `#${log.id}`, href: `/admin/activity-logs/${log.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Activity Log #${log.id}`} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/activity-logs">
                            <ArrowLeft className="me-2 size-4" />
                            Back to list
                        </Link>
                    </Button>
                </div>

                <div className="rounded-lg bg-white p-6 dark:bg-brand-bg-dark">
                    <h2 className="text-lg font-semibold">
                        {log.action} · {log.auditable_type_short ?? 'System'}
                        {log.auditable_id ? ` #${log.auditable_id}` : ''}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {log.created_at
                            ? new Date(log.created_at).toLocaleString()
                            : '—'}
                        {' · '}
                        {log.user?.name ?? 'system'}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                        <Badge variant="secondary">
                            IP: {log.ip_address ?? '—'}
                        </Badge>
                        <Badge variant="secondary">
                            Method: {log.method ?? '—'}
                        </Badge>
                        <Badge variant="secondary">
                            Property: {log.property?.name ?? '—'}
                        </Badge>
                    </div>

                    {log.url && (
                        <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                            {log.method} {log.url}
                        </p>
                    )}
                </div>

                <div className="rounded-lg bg-white p-6 dark:bg-brand-bg-dark">
                    <h3 className="mb-3 text-base font-semibold">Changes</h3>
                    <ActivityLogDiff
                        oldValues={log.old_values}
                        newValues={log.new_values}
                    />
                </div>

                {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="rounded-lg bg-white p-6 dark:bg-brand-bg-dark">
                        <h3 className="mb-3 text-base font-semibold">Context</h3>
                        <pre className="overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs">
                            {JSON.stringify(log.meta, null, 2)}
                        </pre>
                    </div>
                )}

                {log.user_agent && (
                    <div className="rounded-lg bg-white p-6 dark:bg-brand-bg-dark">
                        <h3 className="mb-2 text-base font-semibold">User Agent</h3>
                        <p className="break-all font-mono text-xs text-muted-foreground">
                            {log.user_agent}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
