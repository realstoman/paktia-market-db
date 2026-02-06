import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatusCardProps {
    icon: ReactNode;
    title: string;
    value: number;
    description?: string;
    color?: string;
    iconColor?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const StatusCard = ({
    icon,
    title,
    value,
    color = 'bg-primary',
    iconColor = 'default',
}: StatusCardProps) => {
    const getIconColor = () => {
        const variantMap: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline' | 'success'
        > = {
            Pending: 'secondary',
            Preparing: 'default',
            Completed: 'success',
            Cancelled: 'destructive',
        };
        return variantMap[title] || iconColor;
    };

    return (
        <div className={cn('flex items-center gap-2')}>
            <div
                className={cn(
                    'rounded-full border border-sidebar-border/30 p-4 dark:border-sidebar-border/50',
                    color,
                    getIconColor,
                )}
            >
                {icon}
            </div>
            <div>
                <h2 className="text-lg font-medium text-primary">{value}</h2>
                <h3 className="text-sm text-neutral-600">{title}</h3>
            </div>
        </div>
    );
};

export default StatusCard;
