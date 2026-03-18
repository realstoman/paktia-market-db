import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SummaryMetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    className?: string;
}

export function SummaryMetricCard({
    title,
    value,
    description,
    icon: Icon,
    className,
}: SummaryMetricCardProps) {
    return (
        <Card
            className={cn(
                'gap-3 overflow-hidden border-white/80 bg-[linear-gradient(135deg,#f7fbfb_0%,#edf4f4_45%,#ffffff_100%)] py-4 shadow-none dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                <CardTitle className="text-sm text-[#102F33] dark:text-neutral-100">
                    {title}
                </CardTitle>
                <div className="rounded-full border border-white/70 bg-white/80 p-2 text-[#102F33] dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-semibold tracking-tight text-[#102F33] dark:text-white">
                    {value}
                </p>
                {description ? (
                    <p className="mt-1 text-xs text-[#5c7477] dark:text-neutral-400">
                        {description}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}
