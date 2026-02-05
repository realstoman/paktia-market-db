import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatusCardProps {
    icon: ReactNode;
    title: string;
    value: number;
    description?: string;
    color?: string;
    badgeVariant?:
        | 'default'
        | 'secondary'
        | 'destructive'
        | 'outline'
        | 'success';
}

const StatusCard = ({
    icon,
    title,
    value,
    color = 'bg-primary',
    badgeVariant = 'default',
}: StatusCardProps) => {
    const getBadgeVariant = () => {
        const variantMap: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline' | 'success'
        > = {
            Pending: 'secondary',
            Preparing: 'default',
            Completed: 'success',
            Cancelled: 'destructive',
        };
        return variantMap[title] || badgeVariant;
    };

    return (
        <div className={cn('flex items-center gap-2', color)}>
            <div className="rounded-sm border border-sidebar-border/70 bg-neutral-50 p-1.5 dark:border-sidebar-border">
                {icon}
            </div>
            <h3 className="text-base font-medium">{title}</h3>
            <Badge variant={getBadgeVariant()} className="font-semibold">
                {value}
            </Badge>
        </div>
    );
};

export default StatusCard;
