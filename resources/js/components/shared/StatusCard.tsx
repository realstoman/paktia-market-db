import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatusCardProps {
    icon: ReactNode;
    title: string;
    value: number | string;
    description?: string;
    color?: string;
    iconColor?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const StatusCard = ({
    icon,
    title,
    value,
    description,
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
        <div className={cn('flex items-start gap-3')}>
            <div
                className={cn(
                    'rounded-full border border-sidebar-border/30 p-4 dark:border-sidebar-border/90',
                    color,
                    getIconColor,
                )}
            >
                {icon}
            </div>
            <div className="space-y-1.5">
                <h2 className="text-lg leading-none font-medium text-primary">
                    {value}
                </h2>
                <h3 className="text-sm text-neutral-600">{title}</h3>
                {description ? (
                    <p className="max-w-[220px] text-xs leading-5 text-neutral-500">
                        {description}
                    </p>
                ) : null}
            </div>
        </div>
    );
};

export default StatusCard;
