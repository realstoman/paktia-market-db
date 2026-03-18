import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type SummaryMetricCardVariant =
    | 'green'
    | 'gold'
    | 'blue'
    | 'teal'
    | 'indigo'
    | 'rose';

interface SummaryMetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    variant?: SummaryMetricCardVariant;
    className?: string;
}

const variantStyles: Record<
    SummaryMetricCardVariant,
    {
        card: string;
        title: string;
        value: string;
        description: string;
        icon: string;
    }
> = {
    green: {
        card: 'border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-neutral-900 dark:text-neutral-100',
        value: 'text-neutral-950 dark:text-white',
        description: 'text-neutral-600 dark:text-neutral-400',
        icon: 'border-white/70 bg-white/80 text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    gold: {
        card: 'border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-neutral-900 dark:text-neutral-100',
        value: 'text-neutral-950 dark:text-white',
        description: 'text-neutral-600 dark:text-neutral-400',
        icon: 'border-white/70 bg-white/80 text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    blue: {
        card: 'border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-neutral-900 dark:text-neutral-100',
        value: 'text-neutral-950 dark:text-white',
        description: 'text-neutral-600 dark:text-neutral-400',
        icon: 'border-white/70 bg-white/80 text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    teal: {
        card: 'border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-neutral-900 dark:text-neutral-100',
        value: 'text-neutral-950 dark:text-white',
        description: 'text-neutral-600 dark:text-neutral-400',
        icon: 'border-white/70 bg-white/80 text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    indigo: {
        card: 'border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-neutral-900 dark:text-neutral-100',
        value: 'text-neutral-950 dark:text-white',
        description: 'text-neutral-600 dark:text-neutral-400',
        icon: 'border-white/70 bg-white/80 text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    rose: {
        card: 'border-neutral-200/80 bg-[linear-gradient(135deg,#f7f7f2_0%,#ffffff_45%,#eef6ec_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-neutral-900 dark:text-neutral-100',
        value: 'text-neutral-950 dark:text-white',
        description: 'text-neutral-600 dark:text-neutral-400',
        icon: 'border-white/70 bg-white/80 text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
};

export function SummaryMetricCard({
    title,
    value,
    description,
    icon: Icon,
    variant = 'green',
    className,
}: SummaryMetricCardProps) {
    const styles = variantStyles[variant];

    return (
        <Card
            className={cn(
                'gap-3 overflow-hidden py-4 shadow-none',
                styles.card,
                className,
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                <CardTitle className={cn('text-sm', styles.title)}>
                    {title}
                </CardTitle>
                <div className={cn('rounded-full border p-2', styles.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <p className={cn('text-2xl font-semibold tracking-tight', styles.value)}>
                    {value}
                </p>
                {description ? (
                    <p className={cn('mt-1 text-xs', styles.description)}>
                        {description}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}
