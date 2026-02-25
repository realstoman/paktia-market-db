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
                'gap-3 border-neutral-200 bg-white py-4 shadow-none dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                <CardTitle className="text-sm">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                    onClick={onDetailsClick}
                >
                    Details
                    <ExternalLink className="h-3.5 w-3.5" />
                </Button>
            </CardContent>
        </Card>
    );
}
