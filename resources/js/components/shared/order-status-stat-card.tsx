import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/localization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ExternalLink, type LucideIcon } from 'lucide-react';

interface OrderStatusStatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    onDetailsClick: () => void;
    className?: string;
}

export function OrderStatusStatCard({
    title,
    value,
    icon: Icon,
    onDetailsClick,
    className,
}: OrderStatusStatCardProps) {
    const { t } = useLocalization();

    return (
        <Card
            className={cn(
                'gap-3 overflow-hidden border-neutral-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f5f8f8_52%,rgba(16,47,51,0.16)_100%)] py-4 shadow-none dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                <CardTitle className="text-sm text-neutral-900 dark:text-neutral-100">
                    {title}
                </CardTitle>
                <div className="rounded-full border border-white/70 bg-white/80 p-2 text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                    {value}
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 text-xs text-neutral-800 hover:bg-white hover:text-neutral-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    onClick={onDetailsClick}
                >
                    {t('orders.details', 'Details')}
                    <ExternalLink className="h-3.5 w-3.5" />
                </Button>
            </CardContent>
        </Card>
    );
}
