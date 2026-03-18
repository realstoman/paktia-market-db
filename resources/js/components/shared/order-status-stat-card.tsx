import { Button } from '@/components/ui/button';
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
    return (
        <Card
            className={cn(
                'gap-3 overflow-hidden border-[#f3e1b3] bg-[linear-gradient(135deg,#fff8e8_0%,#f8e7bc_45%,#ffffff_100%)] py-4 shadow-none dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                <CardTitle className="text-sm text-[#6b4b16] dark:text-neutral-100">
                    {title}
                </CardTitle>
                <div className="rounded-full border border-[#f1ddb0] bg-white/80 p-2 text-[#8b5e17] dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold tracking-tight text-[#6b4b16] dark:text-white">
                    {value}
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full border border-[#f1ddb0] bg-white/70 px-3 text-xs text-[#6b4b16] hover:bg-white hover:text-[#6b4b16] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    onClick={onDetailsClick}
                >
                    Details
                    <ExternalLink className="h-3.5 w-3.5" />
                </Button>
            </CardContent>
        </Card>
    );
}
