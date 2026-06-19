'use client';

import { ActivityLogDiff } from '@/components/activity-log-diff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';
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

export default function ActivityLogShowPage({ log }: ShowPageProps) {
    const { isRtl, locale, t } = useLocalization();
    const pageTitle = t(
        'activityLogsPage.show.pageTitle',
        'Activity Log #:id',
    ).replace(':id', String(log.id));
    const actionKey = actionTranslationKeys[log.action];
    const actionLabel = actionKey
        ? t('activityLogsPage.actions.' + actionKey, log.action)
        : log.action.replaceAll('_', ' ');
    const entityLabel = log.auditable_type_short
        ? t(
              'activityLogsPage.entities.' + log.auditable_type_short,
              log.auditable_type_short,
          )
        : t('activityLogsPage.table.system', 'System');
    const dateLocale =
        locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US';
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard', 'Dashboard'),
            href: dashboard().url,
        },
        {
            title: t('activityLogsPage.title', 'Activity Logs'),
            href: '/admin/activity-logs',
        },
        { title: '#' + log.id, href: '/admin/activity-logs/' + log.id },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-4 text-start">
                <div className="flex items-center justify-start">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/activity-logs">
                            <ArrowLeft
                                className={cn(
                                    'me-2 size-4',
                                    isRtl && 'rotate-180',
                                )}
                            />
                            {t('activityLogsPage.show.back')}
                        </Link>
                    </Button>
                </div>

                <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-6">
                    <h2 className="text-lg font-semibold">
                        {actionLabel} · {entityLabel}
                        {log.auditable_id ? ' #' + log.auditable_id : ''}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {log.created_at
                            ? new Date(log.created_at).toLocaleString(
                                  dateLocale,
                              )
                            : '—'}
                        {' · '}
                        {log.user?.name ??
                            t('activityLogsPage.table.system', 'System')}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                        <Badge variant="secondary">
                            IP: {log.ip_address ?? '—'}
                        </Badge>
                        <Badge variant="secondary">
                            {t('activityLogsPage.show.method')}:{' '}
                            {log.method ?? '—'}
                        </Badge>
                        <Badge variant="secondary">
                            {t('activityLogsPage.property')}:{' '}
                            {log.property?.name ?? '—'}
                        </Badge>
                    </div>

                    {log.url && (
                        <p
                            dir="ltr"
                            className="mt-2 text-start font-mono text-xs break-all text-muted-foreground"
                        >
                            {log.method} {log.url}
                        </p>
                    )}
                </div>

                <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-6">
                    <h3 className="mb-3 text-base font-semibold">
                        {t('activityLogsPage.show.changes')}
                    </h3>
                    <ActivityLogDiff
                        oldValues={log.old_values}
                        newValues={log.new_values}
                    />
                </div>

                {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-6">
                        <h3 className="mb-3 text-base font-semibold">
                            {t('activityLogsPage.show.context')}
                        </h3>
                        <pre
                            dir="ltr"
                            className="overflow-auto rounded-md border border-border bg-muted/30 p-3 text-start text-xs"
                        >
                            {JSON.stringify(log.meta, null, 2)}
                        </pre>
                    </div>
                )}

                {log.user_agent && (
                    <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-6">
                        <h3 className="mb-2 text-base font-semibold">
                            {t('activityLogsPage.show.userAgent')}
                        </h3>
                        <p
                            dir="ltr"
                            className="text-start font-mono text-xs break-all text-muted-foreground"
                        >
                            {log.user_agent}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
