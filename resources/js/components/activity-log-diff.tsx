'use client';

import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';

interface ActivityLogDiffProps {
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    className?: string;
}

function stringify(value: unknown): string {
    if (value === null || value === undefined) {
        return '—';
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    return String(value);
}

export function ActivityLogDiff({
    oldValues,
    newValues,
    className,
}: ActivityLogDiffProps) {
    const { isRtl, t } = useLocalization();
    const keys = Array.from(
        new Set([
            ...Object.keys(oldValues ?? {}),
            ...Object.keys(newValues ?? {}),
        ]),
    ).sort();

    if (keys.length === 0) {
        return (
            <p className={cn('text-sm text-muted-foreground', className)}>
                {t('activityLogsPage.diff.empty')}
            </p>
        );
    }

    return (
        <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={cn(
                'overflow-hidden rounded-md border border-border bg-background',
                className,
            )}
        >
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                    <tr>
                        <th className="px-3 py-2 text-start font-medium">
                            {t('activityLogsPage.diff.field')}
                        </th>
                        <th className="px-3 py-2 text-start font-medium">
                            {t('activityLogsPage.diff.before')}
                        </th>
                        <th className="px-3 py-2 text-start font-medium">
                            {t('activityLogsPage.diff.after')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {keys.map((key) => {
                        const before = oldValues?.[key];
                        const after = newValues?.[key];
                        const changed = stringify(before) !== stringify(after);

                        return (
                            <tr
                                key={key}
                                className={cn(
                                    'border-t border-border',
                                    changed &&
                                        'bg-amber-50 dark:bg-amber-950/20',
                                )}
                            >
                                <td className="px-3 py-2 text-xs text-foreground">
                                    {t(
                                        'activityLogsPage.fields.' + key,
                                        key.replaceAll('_', ' '),
                                    )}
                                </td>
                                <td
                                    dir="auto"
                                    className="px-3 py-2 font-mono text-xs text-rose-700 dark:text-rose-300"
                                >
                                    {stringify(before)}
                                </td>
                                <td
                                    dir="auto"
                                    className="px-3 py-2 font-mono text-xs text-emerald-700 dark:text-emerald-300"
                                >
                                    {stringify(after)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
