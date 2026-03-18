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
        card: 'border-white/80 bg-[linear-gradient(135deg,#f7fbfb_0%,#edf4f4_45%,#ffffff_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-[#102F33] dark:text-neutral-100',
        value: 'text-[#102F33] dark:text-white',
        description: 'text-[#5c7477] dark:text-neutral-400',
        icon: 'border-white/70 bg-white/80 text-[#102F33] dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    gold: {
        card: 'border-[#f3e1b3] bg-[linear-gradient(135deg,#fff8e8_0%,#f8e7bc_45%,#ffffff_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-[#6b4b16] dark:text-neutral-100',
        value: 'text-[#6b4b16] dark:text-white',
        description: 'text-[#8b6a2f] dark:text-neutral-400',
        icon: 'border-[#f1ddb0] bg-white/80 text-[#8b5e17] dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    blue: {
        card: 'border-[#d7e6fb] bg-[linear-gradient(135deg,#f4f9ff_0%,#e5f0ff_45%,#ffffff_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-[#173b63] dark:text-neutral-100',
        value: 'text-[#173b63] dark:text-white',
        description: 'text-[#587798] dark:text-neutral-400',
        icon: 'border-[#d7e6fb] bg-white/80 text-[#295c92] dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    teal: {
        card: 'border-[#d5ece9] bg-[linear-gradient(135deg,#f3fbfa_0%,#dfefec_45%,#ffffff_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-[#184b4b] dark:text-neutral-100',
        value: 'text-[#184b4b] dark:text-white',
        description: 'text-[#5c8080] dark:text-neutral-400',
        icon: 'border-[#d5ece9] bg-white/80 text-[#1e6666] dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    indigo: {
        card: 'border-[#e0e1fb] bg-[linear-gradient(135deg,#f7f7ff_0%,#e8e9ff_45%,#ffffff_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-[#2f316b] dark:text-neutral-100',
        value: 'text-[#2f316b] dark:text-white',
        description: 'text-[#64679a] dark:text-neutral-400',
        icon: 'border-[#e0e1fb] bg-white/80 text-[#454aa8] dark:border-white/10 dark:bg-white/10 dark:text-white',
    },
    rose: {
        card: 'border-[#f4d9e3] bg-[linear-gradient(135deg,#fff6f9_0%,#f8e4eb_45%,#ffffff_100%)] dark:border-neutral-800 dark:bg-neutral-900',
        title: 'text-[#6a2740] dark:text-neutral-100',
        value: 'text-[#6a2740] dark:text-white',
        description: 'text-[#92586c] dark:text-neutral-400',
        icon: 'border-[#f4d9e3] bg-white/80 text-[#9a3f63] dark:border-white/10 dark:bg-white/10 dark:text-white',
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
